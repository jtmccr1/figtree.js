"use strict";
import { select } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { easeCubic } from "d3-ease";
import { v4 } from "uuid";
import { mergeDeep } from "../../utilities.js";
import "d3-selection-multi";
import {rectangularLayout} from '../layout'
import p from "../../_privateConstants.js";
import { extent } from "d3-array";

/** @module figtree */

/**
 * The FigTree class
 *
 * A class that takes a tree and draws it into the the given SVG root element. Has a range of methods
 * for adding interactivity to the tree (e.g., mouse-over labels, rotating nodes and rerooting on branches).
 * The figure updates with animated transitions when the tree is updated.
 */

export class FigTree {
  static DEFAULT_SETTINGS() {
    return {
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      layout:rectangularLayout,
      transitions: {
        duration: 500,
        ease: easeCubic,
      },
      x: {
        scale: scaleLinear,
        offsetBy: 0,
        scaleBy: 1,
        reverse: false,
      },
      y: {
        scale: scaleLinear,
        offsetBy: 0,
        scaleBy: 1,
        reverse: false,
      },
    };
  }

  /**
   * The constructor. All parameters are optional can be set with setters after construction.
   * @param {DOM.node} [svg=null] - the svg that will hold the figure.
   * @param margins {Object} [margins={top:10,bottom:60,left:30,right:60}]  The margins around the tree figure. Axis will go in these spaces if applicable
   * @param tree {Tree} [null] - the tree
   * @param settings {Object} [settings={width:null,height:null}] sets the size for drawing the figure. If not provided, the size of the svg will be used.
   * @returns {FigTree}
   */

  constructor(settings = {}) {
    this.id = Symbol("FIGREE");

    const safeSettings = mergeDeep(FigTree.DEFAULT_SETTINGS(), settings);

    this._margins = safeSettings.margins;

    this._transitions = safeSettings.transitions;

    this[p.svg] = safeSettings.svg;
    this[p.tree] = safeSettings.tree;

    this[p.layout] = safeSettings.layout
    this.setupSVG();
    this.axes = [];
    this._features = [];
    this._vertexCache = {};
    this._nodeUpdated ={};
    this.layoutUpdated = true;
    this._calculateScales = true;
    this.baubles=[];

    this[p.tree].subscribeCallback(()=>{
      this._vertexCache = {} // clear;
      this.render();
    })
    this.settings = safeSettings;

    //TODO make that a constant

    for(const bauble of safeSettings.baubles){
        this.addBauble(bauble);
    }

    this.render();
    return this;

  }

  addBauble(bauble){
    this.baubles.push(bauble);
    bauble.selection(this.svgSelection)
    bauble.setFigureTransitions(this.transitions())
  }

//   handelTreeUpdate({nodeId,updateLayout}){
//     if(updateLayout){
//         this.layoutUpdated=true;
//         delete this._vertexCache[nodeId]
//     }
//   }

  /**
   * Setter/getter for transition setting.
   * @param t {Object} [t={transitionEase,transitionDuration:} - sets the transition ease and duration (in milliseconds) and returns the figtree instance
   * if nothing is provided it returns the current settings.
   * @returns {{transitionEase: cubicInOut, transitionDuration: number}|*}
   */
  transitions(t = null) {
    if (t) {
      this._transitions = { ...this._transitions, ...t };
    } else {
      return this._transitions;
    }
  }

  /**
   * Setter/getter for updating the margins.
   * @param m {Object} [margins={top:10,bottom:60,left:30,right:60}] -any provided object will be merged with the current settings.
   * If nothing is provided returns current margins.
   * @returns {*}
   */
  margins(m = null) {
    if (m !== null) {
      this._margins = { ...this._margins, ...m };
      return this;
    } else {
      return this._margins;
    }
  }

  //todo - layout start node
  layoutTree() {
    this[p.layout](this.tree().root, this._vertexCache);
  }

  render() {
    select(`#${this.svgId}`).attr(
      "transform",
      `translate(${this._margins.left},${this._margins.top})`
    );

    if(this.layoutUpdated){
        //update layout
        this.layoutTree();
        this._setUpScales();
        //update scales if needed
        for (const bauble of this.baubles.reverse()) {
            bauble.renderAll(this.scales,this._vertexCache);
        }
    }

    for (const feature of this._features) {
      feature.render();
    }

    return this;
  }


  /**
   * Registers some text to appear in a popup box when the mouse hovers over the selection.
   *
   * @param selection -  {string} - passed to the d3 select. Adds an event listener to this selection to trigger the tooltip
   * @param text - {string} - text to display in the tooltip.
   */
  addToolTip(selection, text) {
    this.svgSelection.selectAll(selection).on("mouseover", function (selected) {
      let tooltip = document.getElementById("tooltip");
      if (typeof text === typeof "") {
        tooltip.innerHTML = text;
      } else {
        tooltip.innerHTML = text(selected.node);
      }
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });
    this.svgSelection.selectAll(selection).on("mouseout", function () {
      let tooltip = document.getElementById("tooltip");
      tooltip.style.display = "none";
    });
    return this;
  }


  /**
   * Get or set tree
   * @param tree
   * @return {FigTree|Tree}
   */
  tree(tree = null) {
    if (tree === null) {
      return this[p.tree];
    } else {
      this[p.tree] = tree;
      this[p.tree].subscribeCallback(() => {
        this.update();
      });
      this.render();
      return this;
    }
  }

  /**
   * Get or set layout function
   * @param layout
   * @return {FigTree|*}
   */
  layout(layout = null) {
    if (layout === null) {
      return this[p.layout];
    } else {
      this[p.layout] = layout;
      this._vertexCache = {};
      this.render();
      return this;
    }
  }

  /**
   * Add a feature to the update cycle. Also sets the figure of the feature to this figtree instance
   * The feature's update cycle will be called
   * with an an object containing the vertices and edges.
   * @param feature
   * @return {FigTree}
   */
  feature(f) {
    f.figure(this);
    this._features = this._features.concat(f);
    this.update();
    return this;
  }

  /**
     * remove a feature from the update cycle. Also removes the figure from the feature

     * @param feature
     * @return {FigTree}
     */
  removeFeature(f) {
    f.figure(null);
    this._features = this._features.filter((feature) => feature != f);
    this.update();
    return this;
  }

  _setUpScales() {
    let width, height;
    if (Object.keys(this.settings).indexOf("width") > -1) {
      width = this.settings.width;
    } else {
      width = this[p.svg].getBoundingClientRect().width;
    }
    if (Object.keys(this.settings).indexOf("height") > -1) {
      height = this.settings.height;
    } else {
      height = this[p.svg].getBoundingClientRect().height;
    }
      const rootVertex = this._vertexCache[(this.tree().root.id)];
      const xdomain = [0,rootVertex.maxX];
      const ydomain = [0, rootVertex.maxY];
      const xScale = this.settings.x
        .scale()
        .domain(xdomain)
        .range([0, width - this._margins.right - this._margins.left]);
      const yScale = this.settings.y
        .scale()
        .domain(ydomain)
        .range([height - this._margins.bottom - this._margins.top, 0]); //flipped
      this.scales = { x: xScale, y: yScale, width, height };
  }

  setupSVG() {
    this.svgId = `g-${v4()}`;
    select(this[p.svg]).select(`#${this.svgId}`).remove();
  
    // add a group which will contain the new tree
    select(this[p.svg])
      .append("g")
      .attr("id", this.svgId)
      .attr("transform", `translate(${this._margins.left},${this._margins.top})`);
  
    this.svgSelection = select(this[p.svg]).select(`#${this.svgId}`);
  
  }
}


/**
 * A helper function that sets the positions of the node and nodebackground groups in the svg and then calls update
 * functions of the node and node background elements.
 * @param nodes
 */
function updateNodePositions(nodes) {
  this.nodeManager.update(nodes); //hack to see if the node has been laidout TODO set flag
  this.nodeBackgroundManager.update(nodes);
}

/**
 * A helper function that sets the positions of the branch groups and calls the update functions of the branch elements.
 * @param nodes
 */
function updateBranchPositions(nodes) {
  this.branchManager.update(nodes);
}
