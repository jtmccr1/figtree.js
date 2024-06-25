import {Bauble} from '../bauble'


export class RectangularShapeDelegate  {

    constructor(options){
        const {attrs} = options;
        this.attrs= {width:5,
            height:5,
            rx:2,
            ry:2,
            ...attrs}

        }
        appender(enter,vertexMap,{x,y}){
            return  enter
             .append("rect")
             .attr("x",d=>x(vertexMap[d.id].x)-this.width(d)/2)
             .attr("y",d=>y(vertexMap[d.id].y)-this.height(d)/2)
             .attr("width",(d,i,n) =>  typeof this.attrs.width === 'function' ? this.attrs.width(d, i, n) : this.attrs.width)
             .attr("height",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.height(d, i, n) : this.attrs.height)
             .attr("rx",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.ry(d, i, n) : this.attrs.rx)
             .attr("ry",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.rx(d, i, n) : this.attrs.ry)
         }
         updater(update,vertexMap, {x,y}){
            return  update
            .attr("x",d=>x(vertexMap[d.id].x)-this.width(d)/2)
            .attr("y",d=>y(vertexMap[d.id].y)-this.height(d)/2)
            .attr("width",(d,i,n) =>  typeof this.attrs.width === 'function' ? this.attrs.width(d, i, n) : this.attrs.width)
            .attr("height",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.height(d, i, n) : this.attrs.height)
            .attr("rx",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.ry(d, i, n) : this.attrs.rx)
            .attr("ry",(d,i,n) =>  typeof this.attrs.r === 'function' ? this.attrs.rx(d, i, n) : this.attrs.ry)
     
         }

         width(d){
            return  typeof this.attrs.width === 'function' ? this.attrs.width(d, i, n) : this.attrs.width; 
        }
        height(d){
            return typeof this.attrs.r === 'function' ? this.attrs.height(d, i, n) : this.attrs.height;
        }
}

/**
 * A helper function that returns a new rectangular bauble
 * @returns {RectangularBauble}
 */
export function rectangle(dataP,options){
        return new Bauble(dataP,new RectangularShapeDelegate(options),options);
    }
    