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

// inheritance is the wrong way to go want a delegate here.
export class Bauble {
  constructor(dataProvider, shapeDelegate, options = {}) {
    this.id = `n${v4()}`;
    this._dataP = dataProvider;
    const { attrs, styles, interactions, transitions } = {
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
  /**
   * A function that appends the element to the selection, joins the data, assigns the attributes to the svg objects
   * updates and remove unneeded objects.
   * @param selection
   */
  update(selection) {
    throw new Error("Don't call the base class method");
  }

  clear(selection) {
    selection.selectAll(`.${this.id}`).remove();
  }
  // figure needs to know the extent of the layed out data to make scales,
  // need a function that goes from here to scale

  // get all data points
  // layout tree
  // compute scale  based on data points
  // make
  // each implementation will handle how it gets added and this class with handle other stylings
  renderAll(scales, vertexMap) {
    this._selection
      .selectAll(`.${this.id}`)
      .data(this.data)
      .join(
        (enter) =>
          this.shapeDelegate
            .appender(enter, vertexMap,scales)
            // .attr("class", (d) => getClassesFromNode(d).join(" "))
            .attr("class", d=>`node-shape ${this.id} ${getClassesFromNode(d).join(" ")}`)
            .attr("id", d=>d.id)
            .attr("stroke-width", (d, i, n) => this.applyStrokeWidth(d, i, n))
            .attr("stroke", (d, i, n) => this.applyStroke(d, i, n))
            .attr("fill", (d, i, n) => this.applyFill(d, i, n))
            .attr("opacity", (d, i, n) => this.applyOpacity(d, i, n))
            .each((d, i, n) => {
              const element = select(n[i]);
              for (const [key, func] of Object.entries(this.interactions)) {
                element.on(key, (d, i, n) => func(d, i, n));
              }
            }),
        (update) => {
          const selection = update
            .transition(v4())
            .duration(this._transitions.duration)
            .ease(this._transitions.ease);

          return this.shapeDelegate
            .updater(selection, vertexMap,scales)
            // .attr("class", (d) => getClassesFromNode(d).join(" "))
            .attr("class", d=>`node-shape ${this.id} ${getClassesFromNode(d).join(" ")}`)
            .attr("id", d=>d.id)
            .attr("stroke-width", (d, i, n) => this.applyStrokeWidth(d, i, n))
            .attr("stroke", (d, i, n) => this.applyStroke(d, i, n))
            .attr("fill", (d, i, n) => this.applyFill(d, i, n))
            .attr("opacity", (d, i, n) => this.applyOpacity(d, i, n))
            .each((d, i, n) => {
              const element = select(n[i]);
              for (const [key, func] of Object.entries(this.interactions)) {
                element.on(key, (d, i, n) => func(d, i, n));
              }
            });
        }
      );
  }

  applyStrokeWidth(d, i, n) {
    return typeof this.attrs.strokeWidth === "function"
      ? this.attrs.strokeWidth(d, i, n)
      : this.attrs.strokeWidth;
  }
  applyStroke(d, i, n) {
    return typeof this.attrs.stroke === "function"
      ? this.attrs.stroke(d, i, n)
      : this.attrs.stroke;
  }
  applyFill(d, i, n) {
    return typeof this.attrs.fill === "function"
      ? this.attrs.fill(d, i, n)
      : this.attrs.fill;
  }
  applyOpacity(d, i, n) {
    return typeof this.attrs.opacity === "function"
      ? this.attrs.opacity(d, i, n)
      : this.attrs.opacity;
  }
}
