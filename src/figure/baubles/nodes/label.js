import { Bauble } from "../bauble";
import { textSafeDegrees } from "../../layout/polarLayout.f";

/**
 * Bauble class for labels
 */
export class NodeLabelShapeDelegate {
  constructor(options) {
    this.text = options.text ? options.text : "No label provided";
    this.spacing = options.spacing?options.spacing: 15;
  }
  appender(enter, vertexMap, scale) {
    const added =  enter
      .append("text")

      return this.updater(added,vertexMap,scale)
     
  }
  updater(update, vertexMap, scale) {
    return update
      .attr("x", (d) => scale(vertexMap[d.id]).x)
      .attr("y", (d) => scale(vertexMap[d.id]).y)
      .attr("dx", (d) => this.dx(scale(vertexMap[d.id]),d))
      .attr("dy", (d) => this.dy(scale(vertexMap[d.id]),d))
      .attr("alignment-baseline", (d) => this.baseline(scale(vertexMap[d.id]), d))
      .attr("text-anchor", (d) => this.anchor(scale(vertexMap[d.id]),d),)
      .attr("transform", (d) => this.rotation(scale(vertexMap[d.id]),d))
      .text((d, i, n) =>
        typeof this.text === "function" ? this.text(d, i, n) : this.text
      );
  }

   dx(v,node){
    const labelxScootFactor = node.children?-1:1
   return v.theta?  Math.cos(v.theta)*this.spacing : labelxScootFactor*this.spacing ; 
  
}
 dy(v,node){
    const labelBelow =
    !!node.children && (!node.parent || node.parent.children[0] !== node);
   
    const dy = v.theta?Math.sin(v.theta)*this.spacing:  node.children? labelBelow ?
-1*this.spacing : this.spacing :
         0 
         return dy
 ; 
}

 rotation(v,d) {
  if (v.theta) {
    const dx = this.dx(v,d)
    const dy = this.dy(v,d)
    return ` rotate(${textSafeDegrees(v.theta)},${v.x+dx},${v.y+dy})`;
  } else {
    return null;
  }
}
 anchor(v, d) {
  const textAnchor = v.theta
    ? v.theta > Math.PI / 2 && v.theta < (3 * Math.PI) / 2
      ? "end"
      : "start"
    : d.children
    ? "end"
    : "start";

  return textAnchor;
}
 baseline(v, node) {
  if (v.theta) {
    return "middle";
  }
  const leftLabel = !!node.children;

  const labelBelow =
    !!node.children && (!node.parent || node.parent.children[0] !== node);

  return leftLabel ? (labelBelow ? "bottom" : "hanging") : "middle";
}


}

/**
 * Helper function for making labels. Sets position and alignment based on
 * vertex or edge object.
 * @param text - text to be displayed
 * @return {*}
 */

//TODO branch label stuff
export function nodeLabel(dataP, options) {
  return new Bauble(dataP, new NodeLabelShapeDelegate(options), options);
}
