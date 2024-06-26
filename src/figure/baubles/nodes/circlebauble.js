import { Bauble } from "../bauble";
/**
 * The CircleBauble class. Each vertex is assigned a circle in the svg.
 */
export class CircleShapeDelegate {
  /**
   * The constructor.
   * @param [settings.radius=6] - the radius of the circle
   */
  constructor(options) {
    const { attrs } = options;
    this.attrs = { r: 5, ...attrs };
    this.className='node-shape'

  }

  /**
   * A function that assigns cy,cx,and r attributes to a selection. (cx and cy are set to 0 each r is the settings radius
   * plus the border.
   * @param selection
   */

  appender(enter, vertexMap, { x, y }) {
    const added = enter.append("circle");

    return this.updater(added, vertexMap, { x, y });
  }
  updater(update, vertexMap, { x, y }) {
    return update
      .attr("cx", (d) => x(vertexMap[d.id].x))
      .attr("cy", (d) => y(vertexMap[d.id].y))
      .attr("r", (d, i, n) =>
        typeof this.attrs.r === "function"
          ? this.attrs.r(d, i, n)
          : this.attrs.r
      );
  }

  // /**
  //  * Helper function to class the node as 'hovered' and update the radius if provided
  //  * @param r - optional hover radius
  //  * @return {CircleBauble}
  //  */
  // hilightOnHover(r = null) {
  //     let oldR;
  //     super.on("mouseenter",
  //         (d, i,n) => {
  //             if(r) {
  //                 if (!this._attrs.r) {
  //                     this._attrs.r = this._attrs["r"];
  //                 }
  //                 oldR=this._attrs["r"];
  //                 this.attr("r", r);
  //             }
  //             const parent = select(n[i]).node().parentNode;
  //             this.update(select(parent));
  //             select(parent).classed("hovered",true)
  //                 .raise();
  //             if(r){
  //                 this.attr("r", oldR);

  //             }

  //             // move to top

  //         });
  //     super.on("mouseleave",
  //         (d,i,n) => {
  //             const parent = select(n[i]).node().parentNode;
  //             select(parent).classed("hovered",false);
  //             this.update(select(parent));

  //         });
  //     return this;
  // }
}

/**
 * helper function returns a new instance of a circle bauble.
 * @return {CircleBauble}
 */
export function circle(dataP, options) {
  return new Bauble(dataP, new CircleShapeDelegate(options), options);
}
