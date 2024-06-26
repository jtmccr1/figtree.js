"use strict";

/** @module bauble */
import { v4 } from "uuid";
import { select } from "d3-selection";
import { transition } from "d3-transition";
import { getClassesFromNode } from "../layout/layoutHelpers";
/**
 * The Bauble class
 *
 * This is a shape or Decoration at the node or edge of a tree.
 */


//TODO add a group for each bauble with optional class so we can style backgrounds etc with css

export class Bauble { 
  constructor(dataProvider, shapeDelegate, options = {}) {
    this.id = `n${v4()}`;
    this._dataP = dataProvider;
    const { attrs, styles, interactions, transitions} = {
      attrs: {},
      styles: {},
      interactions: {},
      transitions: null,
      ...options,
    };

    this.attrs = attrs;
    this.styles = styles;
    this.interactions = interactions;

    this._transitions = transitions;
    this._selection = null;

    this.class = options.class?options.class:'';
    this.shapeDelegate = shapeDelegate;
  }

  setFigureTransitions(transitions) {
    if (this._transitions == null) {
      this._transitions = transitions;
    }
  }

  selection(selection = null) {
    if (selection) {
      this._selection = selection;
      return this;
    } else {
      return this._selection;
    }
  }
  get data() {
    if (typeof this._dataP === "function") {
      return this._dataP();
    } else {
      return this._dataP;
    }
  }
  // figure needs to know the extent of the layed out data to make scales,
  // need a function that goes from here to scale

  // get all data points
  // layout tree
  // compute scale  based on data points
  // make
  // each implementation will handle how it gets added and this class with handle other stylings
  renderAll(scales, vertexMap) {

    const g = this._selection
      .selectAll(`#${this.id}`)
      .data([1])
      .join('g')
      .attr('id',this.id)
      .attr('class', this.class)

    g
      .selectAll(`.${this.shapeDelegate.className}`)
      .data(this.data)
      .join(
        (enter) => this.enterFunction(enter, scales, vertexMap),
        (update) => this.updateFunction(update, scales, vertexMap)
      );
  }

  clear(){
    this._selection.select(`#${this.id}`).remove()
  }

  enterFunction(enter, scales, vertexMap) {
    const selection = this.shapeDelegate
      .appender(enter, vertexMap, scales)
      // .attr("class", (d) => getClassesFromNode(d).join(" "))
      .attr(
        "class",
        (d) => ` ${this.shapeDelegate.className} ${getClassesFromNode(d).join(" ")}`
      )
      .attr("id", (d) => d.id);

    for (const attribute in this.attrs) {
      selection.attr(
        attribute.replace(/([A-Z])/g, "-$1").trim(),
        this.attrs[attribute]
      );
    }
    selection.each((d, i, n) => {
      const element = select(n[i]);
      for (const [key, func] of Object.entries(this.interactions)) {
        element.on(key, () => func(d, i, n));
      }
    });
    return selection;
  }
  updateFunction(update, scales, vertexMap) {
    const t = update
      .transition(v4())
      .duration(this._transitions.duration)
      .ease(this._transitions.ease);

    const selection = this.shapeDelegate 
      .updater(t, vertexMap, scales)
      .attr(
        "class",
        (d) => `${this.shapeDelegate.className} ${getClassesFromNode(d).join(" ")}` //TODO move this node shape to the delegate
      )
      .attr("id", (d) => d.id);
    for (const attribute in this.attrs) {
      selection.attr(
        attribute.replace(/([A-Z])/g, "-$1").trim(),
        this.attrs[attribute]
      );
    }
    selection.each((d, i, n) => {
      const element = select(n[i]);
      for (const [key, func] of Object.entries(this.interactions)) {
        element.on(key, () => func(d, i, n));
      }
    });
    return selection;
  }
}
