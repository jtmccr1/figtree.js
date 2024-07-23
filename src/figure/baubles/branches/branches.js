import { normalizePath } from "../../layout/layoutHelpers";
import { polarToCartesian } from "../../layout/polarLayout.f";
import { Bauble } from "../bauble";
/**
 * The CircleBauble class. Each vertex is assigned a circle in the svg.
 */
export class BranchShapeDelegate {
  /**
   * The constructor.
   * @param [settings.radius=6] - the radius of the circle
   */
  constructor(options) {
    this._curvature = options.curvature !== undefined ? options.curvature : 1;
    this.className = "branch-path";
    this.type=options.type?options.type:"rectangular"
  }

  get curvature() {
    if (typeof this._curvature == "function") {
      return this._curvature();
    }
    return this._curvature;
  }
  /**
   * A function that assigns cy,cx,and r attributes to a selection. (cx and cy are set to 0 each r is the settings radius
   * plus the border.
   * @param selection
   */

  appender(enter, vertexMap, scale) {
    // This will need a label
    const added = enter.append("path");
    return this.updater(added, vertexMap, scale);
  }
  updater(update, vertexMap, scale) {
    return update
      .attr("d", (d) => this.pathGenerator(d, vertexMap, scale))
      .attr("fill", "none");
  }
  pathGenerator(node, vertexMap, scale) {
    if (node.parent === undefined) {
      return "";
    }

    const parentV = vertexMap.get(node.parent);
    const childV = vertexMap.get(node);
    const parent = {x:scale.x(parentV.x),y:scale.y(parentV.y),r:parentV.r?scale.r(parentV.r):undefined,theta:parentV.theta}
    const child = {x:scale.x(childV.x),y:scale.y(childV.y),r:childV.r?scale.r(childV.r):undefined,theta:childV.theta}
    let path;
    switch (this.type) {
      case "rectangular": {
        if (this.curvature === 0) {
          // no curve
          const x1 = parent.x + 0.001; // tiny adjustment for faded line (can't have y or x dimension not change at all
          path = `M${x1},${parent.y}L${parent.x},${child.y}L${child.x},${
            child.y + 0.001
          }`;
        } else if (this.curvature < 1) {
          // curve
          path = `M${parent.x},${parent.y}C${parent.x},${child.y}, ${
            parent.x + Math.abs(this.curvature * (parent.x - child.x))
          },${child.y} ${child.x},${child.y}`;
        } else {
          //(curvature == 1)
          path = `M${parent.x},${parent.y}L${(parent.x + child.x) / 2},${
            (parent.y + child.y) / 2
          }L${child.x},${child.y}`;
        }
        break;
      }
      case "polar":
        {
          const step = polarToCartesian(parent.r,child.theta);// need to do this from the vertices
          // step where the arc goes to. have paren and child thetas and parent r. so we can get x,y
          const arcBit =
            parent.theta === child.theta || parent.r === 0
              ? ""
              : `A${parent.r},${parent.r} 0 0 ${
                  parent.theta < child.theta ? 1 : 0
                } ${step.x},${step.y}`; //Arc flag is going from 1 to 0 continuously
          path = `M${parent.x},${parent.y} ${arcBit} L${child.x},${child.y}`;
          break;
        }
        case "radial":
          {
            path = `M${parent.x},${parent.y}L${child.x},${child.y}`;
            break;
          }
          default:
            path = `M${parent.x},${parent.y}L${child.x},${child.y}`;
    }
    return normalizePath(path);

  }
}
export function branches(dataP, options) {
  return new Bauble(dataP, new BranchShapeDelegate(options), options);
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
