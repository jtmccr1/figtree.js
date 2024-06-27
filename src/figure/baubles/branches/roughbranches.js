
import { BranchShapeDelegate} from "./branches";
import {roughFactory} from "../nodes/roughcirclebauble";
import { Bauble } from "../bauble";

export class RoughBranchShapeDelegate extends BranchShapeDelegate {

    constructor(options) {
        super(options);
        const { attrs,_roughSettings } = options;
        this.attrs = { r: 5, strokeWidth:1,stroke:'black',fill:null,...attrs };
        this._roughSettings = _roughSettings?_roughSettings:{fill:this.attrs.fill};
        this.className='branch-path'
    }

    pathGenerator(node,vertexMap,{x,y}){
        const basicPath=super.pathGenerator(node,vertexMap,{x,y});
        return [...roughFactory.path(basicPath,this._roughSettings).childNodes].map(d=>d.getAttribute("d"))[0]

    }

}

/**
 * branch is a helper function that returns a new branch instance.
 * @returns {BaubleManager|*}
 */
export function roughBranches(dataP,options){
    return new Bauble(dataP,new RoughBranchShapeDelegate(options),options);
}