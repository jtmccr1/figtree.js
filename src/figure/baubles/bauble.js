"use strict";

/** @module bauble */
import {v4}  from "uuid";
import {select} from 'd3-selection'
import {getClassesFromNode} from "../layout/layoutHelpers";
/**
 * The Bauble class
 *
 * This is a shape or Decoration at the node or edge of a tree.
 */
export class Bauble {
    constructor(dataProvider,options={}) {
        this.id=`n${v4()}`;
        this._dataP = dataProvider
        const {attrs,styles,interactions,transitions}= {attrs:{},styles:{},interactions:{},...options};

        this.attrs = attrs;
        this.styles = styles;
        this.interactions = interactions;

        this._transitions = transitions;
        this._selection=null
    }

    setFigureTransitions(transitions){
        if(this._transitions==null){
            this._transitions = transitions
        }
    }
    
    selection(selection=null){
        if(selection){
            this._selection=selection
            return this;
        }else{
            return this._selection
        }
    }
    get data(){
        if (typeof this._dataP === 'function') {
                return this._dataP()
        }else{
            return this._dataP
        }
    }
    /**
     * A function that appends the element to the selection, joins the data, assigns the attributes to the svg objects
     * updates and remove unneeded objects.
     * @param selection
     */
    update(selection) {
        throw new Error("Don't call the base class method")
    }

    clear(selection){
        selection.selectAll(`.${this.id}`).remove()
    }
    // figure needs to know the extent of the layed out data to make scales,
    // need a function that goes from here to scale

    // get all data points
    // layout tree
    // compute scale  based on data points
    // make 
// each implementation will handle how it gets added and this class with handle other stylings
    renderAll(scales,vertexMap){
        console.log(this)
            this._selection
            .selectAll(`.${this.id}`)
            .data(this.data.map(d=>vertexMap[d.id]))
            .join(
                enter => 
                    this.appender(enter,scales)
                .attr("class", (d) => getClassesFromNode(d).join(" "))    
                .attr("class",`node-shape ${this.id}`)
                    .each((d,i,n)=>{
                        const element = select(n[i]);
                        this.applyAttrs(element)
                        for( const [key,func] of Object.entries(this.interactions)){
                            element.on(key,(d,i,n)=>func(d,i,n))
                        }
                    }),
                    update=> this.updater(update,scales)
                    .attr("class", (d) => getClassesFromNode(d).join(" "))    
                    .attr("class",`node-shape ${this.id}`)
                    .each((d,i,n)=>{
                        const element = select(n[i]);
                        this.applyAttrs(element)
                        for( const [key,func] of Object.entries(this.interactions)){
                            element.on(key,(d,i,n)=>func(d,i,n))
                        }
                    }),
                )
            }


    applyAttrs(selection){
        selection.attr('stroke-width', typeof this.attrs.strokeWidth === 'function' ? (d, i, n) => this.attrs.strokeWidth(d, i, n) : this.attrs.strokeWidth)
        selection.attr('stroke', typeof this.attrs.stroke === 'function' ? (d, i, n) => this.attrs.stroke(d, i, n) : this.attrs.stroke)
        selection.attr('fill', typeof this.attrs.fill === 'function' ? (d, i, n) => this.attrs.fill(d, i, n) : this.attrs.fill)
        selection.attr('opacity', typeof this.attrs.opacity === 'function' ? (d, i, n) => this.attrs.opacity(d, i, n) : this.attrs.opacity)

        return selection;
    }
   

}