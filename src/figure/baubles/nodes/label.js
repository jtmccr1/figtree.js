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
      // .attr("x", (d) => scale.x(vertexMap.get(d).x))
      // .attr("y", (d) => scale.y(vertexMap.get(d).y))

      .attr("transform", (d) => this.transform(vertexMap.get(d),d,scale))
      .attr("alignment-baseline", (d) => this.baseline(vertexMap.get(d),d))
      .attr("text-anchor", (d) => this.anchor(vertexMap.get(d),d))
      .attr("dx", (d) => this.dx(vertexMap.get(d),d))
      .attr("dy", (d) => this.dy(vertexMap.get(d),d))
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
  transform(v,node,scale){
    return `translate(${scale.x(v.x)},${scale.y(v.y)}) ${this.rotation(v,node)}`
  }
 rotation(v,d) {
  if (v.theta) {
    const dx = this.dx(v,d)
    const dy = this.dy(v,d)
    return ` rotate(${textSafeDegrees(v.theta)},${v.x+dx},${v.y+dy})`;
  } else {
    return '';
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
