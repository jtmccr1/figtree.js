import {Bauble} from "../bauble";


/**
 * Bauble class for labels
 */
export class LabelShapeDelegate {
    constructor(options) {
        this.text = options.text?options.text: "No label provided"; 
    }
    appender(enter,vertexMap,scale){
        return enter
        .append("text")
        .attr("x",d=>scale(vertexMap[d.id]).x)
        .attr("y",d=>scale(vertexMap[d.id]).y)
        .attr("dx",d=>vertexMap[d.id].textLabel.dx)
        .attr("dy",d=>vertexMap[d.id].textLabel.dy)
        .attr("alignment-baseline",d=>vertexMap[d.id].textLabel.alignmentBaseline)
        .attr("text-anchor",d=>vertexMap[d.id].textLabel.textAnchor)
        .text((d,i,n)=>typeof this.text === 'function' ? this.text(d, i, n) : this.text)
    }
    updater(update,vertexMap,scale){
        return update
        .attr("x",d=>scale(vertexMap[d.id]).x)
        .attr("y",d=>scale(vertexMap[d.id]).y)
        .attr("dx",d=>vertexMap[d.id].textLabel.dx)
        .attr("dy",d=>vertexMap[d.id].textLabel.dy)
        .attr("alignment-baseline",d=>vertexMap[d.id].textLabel.alignmentBaseline)
        .attr("text-anchor",d=>vertexMap[d.id].textLabel.textAnchor)
        .text((d,i,n)=>typeof this.text === 'function' ? this.text(d, i, n) : this.text)
    }
}


/**
 * Helper function for making labels. Sets position and alignment based on
 * vertex or edge object.
 * @param text - text to be displayed
 * @return {*}
 */

//TODO branch label stuff
export function label(dataP,options){
    return new Bauble(dataP,new LabelShapeDelegate(options),options);
}

