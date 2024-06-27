import rough from 'roughjs/dist/rough.umd';
import {select} from "d3-selection"
import {Bauble} from '../bauble'

/** @module bauble */

/**
 * The CircleBauble class. Each vertex is assigned a circle in the svg.
 */
export class RoughCircleShapeDelegate {

    /**
     * The constructor.
     */
    constructor(options) {
        const { attrs,_roughSettings } = options;
        this.attrs = { r: 5, strokeWidth:1,stroke:'black',fill:'grey',...attrs };
        this._roughSettings = _roughSettings?_roughSettings:{fill:this.attrs.fill};
        this.className='node-shape rough'
    }

    // here it would be good to have inheritance bc attrs get applied differently
    appender(enter,vertexMap,{x,y}){

        const added = enter.append('g')
             added.append('path')
                    .attr("class", "rough-fill")
             
            added.append('path')
                    .attr("class","rough-stroke")
        return this.updater(added,vertexMap,{x,y})
    }

    updater(update,vertexMap,{x,y}){
        const [strokePath,fillPath] = [...roughFactory.circle(0, 0, this.attrs.r*2,this._roughSettings).childNodes]
        .map(d => d.getAttribute("d")).reverse();
        

        console.log(fillPath)
        update
        .attr('transform',d=>`translate(${x(vertexMap[d.id].x)},${y(vertexMap[d.id].y)})`)
        
        const that = this;
        // p should be node.
        update.each(function(p,j){
            select(this)
            .select('.rough-fill')
                .attr('d',fillPath)
                .attr('stroke',that.attrs.fill) 
                .attr('stroke-width',that.attrs.strokeWidth)
                .style('fill',"none")

        })

        update.each(function(p,j){
            select(this)
            .select('.rough-stroke')
                .attr('d',strokePath)
                .attr('stroke',that.attrs.stroke) 
                .attr('stroke-width',that.attrs.strokeWidth)
                .style('fill',"none")
        })

        return update;
    }
}

export const roughFactory = rough.svg(document.createElement("svg"));

export function roughCircle(dataP,options){
        return new Bauble(dataP, new RoughCircleShapeDelegate(options), options);
      }
