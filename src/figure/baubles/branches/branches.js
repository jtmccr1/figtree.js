import { Bauble } from "../bauble";
import { curveStepBefore } from "d3-shape";
/**
 * The CircleBauble class. Each vertex is assigned a circle in the svg.
 */
export class BranchShapeDelegate {
  /**
   * The constructor.
   * @param [settings.radius=6] - the radius of the circle
   */
  constructor(options) {
    this._curvature = options.curvature!==undefined ? options.curvature  : 1;
  }

  get curvature(){
    if(typeof this._curvature=='function'){
      return this._curvature();
    }
    return this._curvature;
  }
  /**
   * A function that assigns cy,cx,and r attributes to a selection. (cx and cy are set to 0 each r is the settings radius
   * plus the border.
   * @param selection
   */

  appender(enter, vertexMap, { x, y }) { // This will need a label 
    const added =  enter
      .append("path")      
      return this.updater(added,vertexMap,{x,y})

  }
  updater(update, vertexMap, { x, y }) {
    return update
      .attr("d",d=>this.pathGenerator(d,vertexMap,{x,y}))
      .attr("fill",'none')
      
  }
  pathGenerator(node, vertexMap, { x, y }) {
    if (node.parent === undefined) {
      return "";
    }

    const parent = vertexMap[node.parent.id];
    const child = vertexMap[node.id];
    switch (vertexMap.type) {
      case "EUCLIDEAN": {
        if (this.curvature === 0) {
          // no curve
          var x1 = x(parent.x) + 0.001; // tiny adjustment for faded line (can't have y or x dimension not change at all
          return `M${x1},${y(parent.y)}L${x(parent.x)},${y(child.y)}L${x(
            child.x
          )},${y(child.y) + 0.001}`;
        } else if (this.curvature < 1) {
          // curve
          return `M${x(parent.x)},${y(parent.y)}C${x(parent.x)},${y(
            child.y
          )}, ${
            x(parent.x) + Math.abs(this.curvature * (x(parent.x) - x(child.x)))
          },${y(child.y)} ${x(child.x)},${y(child.y)}`;
        } else {
          //(curvature == 1)
          return `M${x(parent.x)},${y(parent.y)}L${
            (x(parent.x) + x(child.x)) / 2
          },${(y(parent.y) + y(child.y)) / 2}L${x(child.x)},${y(child.y)}`;
        }
      }
    }
  }
}
export function branches(dataP,options){
  return new Bauble(dataP,new BranchShapeDelegate(options),options);
}

// function polarBranchPath(points: { x: number, y: number,r?:number,theta?:number }[]):string{
//     const positions = points.length;
//     switch (positions) {
//         case 3: {
//             const [parent,child,step] = points;
//             const arcBit = parent.theta===child.theta ||parent.r===0?"":`A${parent.r},${parent.r} 0 0 ${parent.theta!<child.theta! ?1:0} ${step.x},${step.y}`;
//             return `M${parent.x},${parent.y} ${arcBit} L${child.x},${child.y}`;

//         } case 0: {
//            return "";
//         } default: {
//             throw new Error(`Error in polar path generator. not expecting ${positions} points`)
//     }

//     }
// }
