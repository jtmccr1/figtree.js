import {select} from "d3-selection";
import {transition} from "d3-transition";

import {v4} from "uuid"
import {AbstractNodeBauble} from "./nodeBauble";

/**
 * The CircleBauble class. Each vertex is assigned a circle in the svg.
 */
export class CircleBauble extends AbstractNodeBauble{

    /**
     * The constructor.
     * @param [settings.radius=6] - the radius of the circle
     */
    constructor(dataP,options)
    {
        super(dataP,options);
        this.attrs= {"r":5,...this.attrs}
    }

    /**
     * A function that assigns cy,cx,and r attributes to a selection. (cx and cy are set to 0 each r is the settings radius
     * plus the border.
     * @param selection
     */

    appender(enter,{x,y}){
       return  enter
        .append("circle")
        .attr("cx",d=>x(d.x))
        .attr("cy",d=>y(d.y))
        .attr("r",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.r(d, i, n) : this.attrs.r)
    }
    updater(update,{x,y}){
       return  update
        .transition(v4())
        .duration(this._transitions.duration)
        .ease(this._transitions.ease)
        .attr("cx",d=>x(d.x))
        .attr("cy",d=>y(d.y))
        .attr("r",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.r(d, i, n) : this.attrs.r)

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
export function circle(){
    return new CircleBauble();
}
