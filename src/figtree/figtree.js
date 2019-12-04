"use strict";
import {select,easeCubic,scaleLinear,mouse,event,line} from "d3";
import uuid from "uuid";
import {mergeDeep} from "../utilities";
import 'd3-selection-multi';
import {CircleBauble} from "../baubles/circlebauble";
import {Branch} from "../baubles/branch";
import {CartoonBauble} from "../baubles/cartoonbauble";
import {GeoLayout} from "../layout/geoLayout";
import {rectangularLayout} from "../layout/rectangularLayout.f";
import DataCollection from "../dataWrappers/dataCollection"
import {min,max} from "d3-array";
import p from "../privateConstants.js"

/** @module figtree */


/**
 * The FigTree class
 *
 * A class that takes a tree and draws it into the the given SVG root element. Has a range of methods
 * for adding interactivity to the tree (e.g., mouse-over labels, rotating nodes and rerooting on branches).
 * The tree is updated with animated transitions.
 */
export class FigTree {

    static DEFAULT_SETTINGS() {
        return {
            xScale: {
                axes:[],
                gap:10,
                scale: scaleLinear,
                revisions: {
                    origin: null,
                    reverseAxis: false,
                    branchScale: 1,
                    offset: 0,
                    hedge: 0
                }
            },
            yScale: {
                axes:[],
                gap:10,
                scale: scaleLinear,
                revisions: {
                    origin: null,
                    reverseAxis: false,
                    offset: 0,
                    hedge: 0
                }
            },
            vertices: {
                hoverBorder: 2,
                backgroundBaubles:[],
                baubles: [new CircleBauble()],
            },
            edges: {
                baubles:[new Branch()]
            },
            cartoons:{
                baubles:[new CartoonBauble()]
            },
            transition: {
                transitionDuration: 500,
                transitionEase: easeCubic
            }
        }
    }

    /**
     * The constructor.
     * @param {svg} svg -  the html svg that will hold the figure
     * @param {Object} layout - an instance of class AbstractLayout
     * @param {Object} margins -  the space within the svg along the border that will not be used to draw the tree. Axis will be placed in this space
     * @param {number} margins.top - the distance from the top
     * @param {number} margins.bottom - the distance from the bottom
     * @param {number} margins.left - the distance from the left
     * @param {number} margins.right - the distance from the right
     * @param {Object} [settings={}] - Settings for the figure. Settings provided in part will not affect defaults not explicitly mentioned
     * @param {Object} settings.xScale - Settings specific for the x scale of the figure
     * @param {Object[]} [settings.xScale.axes=[]] - An array of axis that will use the xScale
     * @param {number} [settings.xScale.gap=10] - The number of pixels between the axis line and the bottom of the svg drawing space
     * @param {function} [settings.xScale.scale=d3.scaleLinear] - A d3 scale for the x dimension
     * @param {Object} settings.xScale.revisions - Any updates or revisions to be made to the x scale set by the layout
     * @param {number} [settings.xScale.revisions.origin=null] - An optional value for specifying the right most edge of the plot.
     * @param {boolean} [settings.xScale.revisions.reverseAxis=false] - Should the x axis decrease from right to left? (default false => number increase from height 0 as we move right to left)
     * @param {number} [settings.xScale.revisions.branchScale=1] - Factor to scale the branchlengths by
     * @param {number} [settings.xScale.revisions.offset=0] - Space to add between the origin and right-most vertex
     * @param {number} [settings.xScale.revisions.hedge = 0] - Space to add between the left edge of the plot and the left most vertex.
     * @param {Object} settings.yScale - Settings specific for the y scale of the figure
     * @param {Object[]} [settings.yScale.axes=[]] - An array of axis that will use the yScale
     * @param {number} [settings.yScale.gap=10] - The number of pixels between the axis line and the left of the svg drawing space
     * @param {function} [settings.yScale.scale=d3.scaleLinear] - A d3 scale for the y dimension
     * @param {Object} settings.vertices - Options specific to the vertices that map to the nodes of the tree
     * @param {number} [settings.vertices.hoverBorder=2] - the number of pixels by which the radius of the vertices will increase by if the highlightNodes option is used and the vertex is hovered
     * @param {Object[]} [settings.vertices.baubles=[new CircleBauble()]] - An array of baubles for the nodes, each bauble can have it's own settings
     * @param {Object[]} [settings.vertices.backgroundBaubles=[]] - An array of baubles that will go behind the main bauble of the nodes, each bauble can have it's own settings
     * @param {Object}    settings.edges - Options specific to the edges that map to the branches of the tree
     * @param {Object[]}  [settings.edges.baubles=[new Branch()]] - An array of baubles that form the branches of the tree, each bauble can have it's own settings
     * @param {Object}    settings.cartoons - Options specific to the cartoons on the tree (triangle clades ect.)
     * @param {Object[]}  [settings.edges.baubles=[new CartoonBauble()]] - An array of baubles that form the cartoons on the firgure, each bauble can have it's own settings     cartoons:{
     * @param {Object} settings.transition - Options controlling the how the figure changes upon interaction
     * @param {number} [settings.transition.transitionDuration=500] - the number of milliseconds to take when transitioning
     * @param {function} [settings.transitionEase=d3.easeLinear] - the d3 ease function used to interpolate during transitioning
     *
     */
    constructor(svg=null, layout=rectangularLayout, margins={top:10,bottom:60,left:30,right:60}, settings = {}) {
        this[p.layout] = layout;
        this.margins = margins;

        this.settings = mergeDeep(FigTree.DEFAULT_SETTINGS(),settings);
        this.callbacks= {nodes:[],branches:[],cartoons:[]};
        this._annotations =[];

        this[p.svg]=svg;
        this.drawn = false;
        this.svgId = `g-${uuid.v4()}`;
        this.svgSelection=null;

        this._transitions=this.settings.transition;

        this[p.vertices]=new DataCollection([],this);
        this[p.edges] = new DataCollection([],this);

        return this;
    }

    transitions(t=null){
        if(t){
            this._transitions=t;
        }else{
            return this._transitions;
        }
    }
    /**
     * An instance method that makes place the svg object in the page. Without calling this method the figure will not be drawn
     * @return {FigTree}
     */
    draw(){
        this[p.updateVerticesAndEdges]();
        this[p.setUpScales]();

        //remove the tree if it is there already

        // this.relativeMargins = {
        //     left: this.originalMargins.left / this.scales.width,
        //     right: this.originalMargins.right / this.scales.width,
        //     top: this.originalMargins.top / this.scales.height,
        //     bottom: this.originalMargins.bottom / this.scales.height
        // };
        select(this[p.svg]).select(`#${this.svgId}`).remove();

        // add a group which will contain the new tree
        select(this[p.svg]).append("g")
            .attr("id",this.svgId)
            .attr("transform",`translate(${this.margins.left},${this.margins.top})`);

        //to selecting every time
        this.svgSelection = select(this[p.svg]).select(`#${this.svgId}`);
        this.svgSelection.append("g").attr("class","annotation-layer");
        this.svgSelection.append("g").attr("class", "axes-layer");
        this.svgSelection.append("g").attr("class", "cartoon-layer");

        this.svgSelection.append("g").attr("class", "branches-layer");
        if (this.settings.vertices.backgroundBorder !==null) {
            this.svgSelection.append("g").attr("class", "nodes-background-layer");
        }
        this.svgSelection.append("g").attr("class", "nodes-layer");


        // create the scales

        if(this.settings.xScale.axes.length>0){
           this[p.addXAxis]();
        }
        if(this.settings.yScale.axes.length>0){
            this[p.addYAxis]();
        }

        this.drawn=true;
        this.update();


        return this;

    }

    /**
     * Updates the figure when the tree has changed
     */
    update() {
        if(!this.drawn){
            return
        }
        this[p.updateVerticesAndEdges]();
        this[p.setUpScales]();
        select(`#${this.svgId}`)
            .attr("transform",`translate(${this.margins.left},${this.margins.top})`);


        // this[p.updateAnnotations]();
        // this[p.updateCartoons]();
        this[p.updateBranches]();
        //
        // if(this.settings.xScale.axes.length>0){
        //     this[p.updateXAxis]();
        // }
        // if(this.settings.yScale.axes.length>0){
        //     this[p.updateYAxis]();
        // }
        //
        // if (this.settings.vertices.backgroundBaubles.length>0) {
        //     this[p.updateNodeBackgrounds]();
        // }

        this[p.updateNodes]();

        return this;

    }

    /**
     * set mouseover highlighting of branches
     * This changes the branch path class to hovered. It is expected that css will handel any visual changes needed.
     * This function is a helper function that calls onHoverBranch with an appropriate action function.
     */
    hilightBranches() {
        const self=this;
        const action = {
            enter:(d,i,n)=>{
                const branch = select(n[i]);
                // self.settings.edges.baubles.forEach((bauble) => {
                //     if (bauble.edgeFilter(branch)) {
                //         bauble.update(branch);
                //     }
                // });
                select(n[i]).classed("hovered", true);
                },
            exit:(d,i,n)=>{
                const branch = select(n[i]);
                // self.settings.edges.baubles.forEach((bauble) => {
                //     if (bauble.edgeFilter(branch)) {
                //         bauble.update(branch);
                //     }
                // });
                select(n[i]).classed("hovered", false);
                }
        };
        this.onHoverBranch({action:action,update:false});
        return this;

    }

    /**
     * A helper function that sets mouseover highlighting of internal nodes. This helper function calls hilightNodes with
     * and ".internal-node" selection.
     */
    hilightInternalNodes() {
        this.hilightNodes(".internal-node");
        return this;

    }
    /**
     * A helper function that sets mouseover highlighting of external nodes. This helper function calls hilightNodes with
     * and ".external-node" selection.
     */
    hilightExternalNodes() {
        this.hilightNodes(".external-node");
        return this;

    }

    /**
     * Set mouseover highlighting of nodes. Node shapes are classed as hovered and bauble sizes are updated according to
     * the hoverborder in the settings.
     * @param {string} selection - the d3 style string that will be pased to the select method
     */
    hilightNodes(selection) {
        const self = this;
        const action = {
            enter: (d, i, n) => {
                const node = select(n[i]);
                const vertex = d;
                self.settings.vertices.baubles.forEach((bauble) => {
                    if (bauble.vertexFilter(vertex)) {
                    bauble.update(node, self.settings.vertices.hoverBorder);
                    }
                });

                node.classed("hovered", true);
            },
            exit: (d,i,n) =>{
                const node = select(n[i]);
                const vertex = d;
                self.settings.vertices.baubles.forEach((bauble) => {
                    if (bauble.vertexFilter(vertex)) {
                    bauble.update(node, 0);
                    }
                });
                node.classed("hovered", false);
            }
        };
        this.onHoverNode({action,selection,update:false});
        return this;

    }

    /**
     * Registers action function to be called when an edge is clicked on. The function is passed
     * edge object that was clicked on and the position of the click as a proportion of the edge length.
     *
     * Optionally a selection string can be provided - i.e., to select a particular branch by its id.
     *
     * @param {Object} action
     * @param selection
     */
    onClickBranch({action, selection,update,proportionMethod}) {
        selection = selection ? selection : ".branch";
        update = update?update:false;
        proportionMethod = proportionMethod? proportionMethod: "manhattan";
        this.callbacks.branches.push(()=>{
            // We need to use the "function" keyword here (rather than an arrow) so that "this"
            // points to the actual SVG element (so we can use d3.mouse(this)). We therefore need
            // to store a reference to the object in "self".
            const self = this;
            const selected = this.svgSelection.selectAll(`${selection}`);
            selected.on("click", function (edge) {
                let proportion;

                const x1 = self.scales.x(edge.v1.x+self.settings.xScale.revisions.offset);
                const x2 = self.scales.x(edge.v0.x+self.settings.xScale.revisions.offset);
                const mx = mouse(document.getElementById(self.svgId))[0];
                if(proportionMethod.toLowerCase()==="manhattan"){
                    proportion = Math.abs( (mx - x2) / (x1 - x2));
                }else if(proportionMethod.toLocaleString()==="euclidean"){
                    const y1 = self.scales.y(edge.v1.y+self.settings.yScale.revisions.offset);
                    const y2 = self.scales.y(edge.v0.y+self.settings.yScale.revisions.offset);
                    const my =  mouse(document.getElementById(self.svgId))[1];
                    proportion=  Math.sqrt(Math.pow((my-y2),2)+Math.pow((mx - x2),2)) / Math.sqrt(Math.pow((y1-y2),2)+Math.pow((x1 - x2),2))

                } else{
                    throw new Error(`proportion method ${proportionMethod} unknown.`)
                }
                action(edge, proportion);
                if(update){
                    self.update();
                }
            })
        });
        this.update();
        return this;

    }

    /**
     * Registers action function to be called when an internal node is clicked on. The function should
     * take the tree and the node that was clicked on.
     *
     * A static method - Tree.rotate() is available for rotating the node order at the clicked node.
     *
     * @param action
     */
    onClickInternalNode(action,update=false) {
        this.onClickNode({action:action, selection:".internal-node",update:update});
        return this;
    }

    /**
     * Registers action function to be called when an external node is clicked on. The function should
     * take the tree and the node that was clicked on.
     *
     * @param action
     */
    onClickExternalNode(action,update=false) {
        this.onClickNode({action:action,selection:".external-node",update:update});
        return this;
    }

    /**
     * Registers action function to be called when a vertex is clicked on. The function is passed
     * the vertex object.
     *
     * Optionally a selection string can be provided - i.e., to select a particular node by its id.
     *
     * @param action
     * @param selection
     */
    onClickNode({action,selection,update}) {
        selection = selection ? selection : ".node";
        // selection = `${selection} .node-shape`;
        this.callbacks.nodes.push(()=>{
            this.onClick({action:action,selection:selection,update:true})
        });
        this.update();
        return this;

    }
    /**
     * General Nodehover callback
     * @param {*} action and object with an enter and exit function which fire when the mouse enters and exits object
     * @param {*} selection defualts to ".node" will select this selection's child ".node-shape"
     */

    onHoverNode({action,selection,update}){
        selection = selection ? selection : ".node";
        update = update?update:false
        // selection = `${selection} .node-shape`;
        this.callbacks.nodes.push(()=>{
            this.onHover({action:action,selection:selection,update:update})
        });
        this.update();
        return this;

    }

    /**
     * General branch hover callback
     * @param {*} action and object with an enter and exit function which fire when the mouse enters and exits object
     * @param {*} selection defualts to .branch
     */
    onHoverBranch({action,selection,update}){
        selection = selection ? `.branch ${selection}` : ".branch";
        update = update? update:false;
        this.callbacks.branches.push(()=>{
            this.onHover({action:action,selection:selection,update:update});
        });
        // this update binds the callbacks to the html nodes
        this.update();
        return this;
    }

    /**
     * Add a hover callback
     * @param {*} action  - object which has 2 functions enter and exit each takes 3 arguments d,i,n d is data n[i] is `this`
     * @param {*} selection  - what to select defaults to
     */
    onHover({action,selection,update}){
        const self=this;
        const selected = this.svgSelection.selectAll(`${selection}`);
        selected.on("mouseover", (d,i,n) => {
            action.enter(d,i,n);
            if(update){
                self.update();
            }
        });
        selected.on("mouseout", (d,i,n) => {
            action.exit(d,i,n);
            if(update){
                self.update()
            }
        });
        return this;
    }

    onClick({action,selection,update}){
        const self=this;
        const selected = this.svgSelection.selectAll(`${selection}`);
        selected.on("click", (d,i,n) => {
            action(d,i,n);
            if(update){
                self.update();
            }
        });
        return this
    }
    /**
     * Registers some text to appear in a popup box when the mouse hovers over the selection.
     *
     * @param selection
     * @param text
     */
    addToolTip(selection, text) {
        this.svgSelection.selectAll(selection).on("mouseover",
            function (selected) {
                let tooltip = document.getElementById("tooltip");
                if (typeof text === typeof "") {
                    tooltip.innerHTML = text;
                } else {
                    tooltip.innerHTML = text(selected.node);
                }
                tooltip.style.display = "block";
                tooltip.style.left =event.pageX + 10 + "px";
                tooltip.style.top = event.pageY + 10 + "px";
            }
        );
        this.svgSelection.selectAll(selection).on("mouseout", function () {
            let tooltip = document.getElementById("tooltip");
            tooltip.style.display = "none";
        });
        return this;

    }

    set treeLayout(layout) {
        this.layout = layout;
        this.update();
    }

    addAnnotation(annotation){
        this._annotations.push(annotation);
        this.update();
        return this;

    }

    updateSettings(settings){
       this.settings = mergeDeep(this.settings,settings);
        this.update();
    }

 /*
 * private methods
 */
 [p.updateVerticesAndEdges](){
    const {vertices,edges} = this[p.layout](this[p.tree]);
    if(!this[p.vertices]){
        this[p.vertices]=new DataCollection(vertices,this);
    }else{
        this[p.vertices].updateData(vertices);
    }
     if(!this[p.edges]){
         this[p.edges]=new DataCollection(edges,this);
     }else{
         this[p.edges].updateData(edges);
     } }


    [p.setUpScales](){
        let width,height;
        if(Object.keys(this.settings).indexOf("width")>-1){
            width =this.settings.width;
        }else{
            width = this[p.svg].getBoundingClientRect().width;
        }
        if(Object.keys(this.settings).indexOf("height")>-1){
            height =this.settings.height;
        }else{
            height = this[p.svg].getBoundingClientRect().height;
        }

        // create the scales
        let xScale,yScale;
        let projection=null;

        if(this.layout instanceof GeoLayout){
            xScale = scaleLinear();
            yScale = scaleLinear();
            projection = this.layout.projection;
        }
        else{
            xScale = this.settings.xScale.scale()
                .domain([max(this[p.vertices].data,d=>d.x),min(this[p.vertices].data,d=>d.x)])
                .range([0, width - this.margins.right-this.margins.left]);

            yScale = this.settings.yScale.scale()
                .domain([min(this[p.vertices].data,d=>d.y),max(this[p.vertices].data,d=>d.y)])
                .range([0, height -this.margins.bottom-this.margins.top]);
        }


        this.scales = {x:xScale, y:yScale, width, height, projection};

    }
    /**
     * Adds or updates nodes
     */
    [p.updateNodes](){
        const nodesLayer = this.svgSelection.select(".nodes-layer");

        const vertices = this[p.vertices].data;
        const elementMap = this[p.vertices].elementMap;

        // DATA JOIN
        // Join new data with old elements, if any.
        const self = this;
        nodesLayer.selectAll(".node")
            .data(vertices, (v) => `n_${v.key}`)
            .join(
                enter=>enter
                    .append("g")
                        .attr("id", (v) => v.key)
                        .attr("class", (v) => ["node", ...v.classes].join(" "))
                        .attr("transform", (v) => {
                            return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
                        })
                        .each(function(v) {
                            if(elementMap.has(v.key)){
                                const element = elementMap.get(v.key);
                                element.update(select(this))
                            }
                        })
                    .append("text")
                        .attr("class", "node-label")
                        .attr("text-anchor", d=>d.leftLabel?"end":"start")
                        .attr("alignment-baseline", d => d.leftLabel?(d.labelBelow ? "bottom": "hanging" ):"middle")
                        .attr("dx", d=>d.leftLabel?"-6":"12")
                        .attr("dy", d => d.leftLabel?(d.labelBelow ? "-8": "8" ):"0")
                        .text((d) => d.textLabel),
                update => update
                    .call(update => update.transition()
                    .duration(this.settings.transition.transitionDuration)
                    .ease(this.settings.transition.transitionEase)
                    .attr("class", (v) => ["node", ...v.classes].join(" "))
                    .attr("transform", (v) => {
                        return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
                    })
                    .on("start", function(v) {
                            if(elementMap.has(v.key)){
                                const element = elementMap.get(v.key);
                                element.update(select(this))
                            }
                    })

                    .select("text .node-label")
                        .transition()
                        .duration(this.settings.transition.transitionDuration)
                        .ease(this.settings.transition.transitionEase)
                        .attr("text-anchor", d=>d.leftLabel?"end":"start")
                        .attr("alignment-baseline", d => d.leftLabel?(d.labelBelow ? "bottom": "hanging" ):"middle")
                        .attr("dx", d=>d.leftLabel?"-6":"12")
                        .attr("dy", d => d.leftLabel?(d.labelBelow ? "-8": "8" ):"0")
                        .text((d) => d.textLabel),
                    )

            );
        // add callbacks
        for(const callback of this.callbacks.nodes){
            callback();
        }
    }

    [p.updateNodeBackgrounds]() {

        const nodesBackgroundLayer = this.svgSelection.select(".nodes-background-layer");

        // DATA JOIN
        // Join new data with old elements, if any.
        const self = this;
        nodesBackgroundLayer.selectAll(".node-background")
            .data(this[p.vertices], (v) => `nb_${v.key}`)
            .join(
                enter=>enter
                    .append("g")
                        .attr("id", (v) => v.id)
                        .attr("class", (v) => ["node-background", ...v.classes].join(" "))
                        .attr("transform", (v) => {
                            return `translate(${this.scales.x(v.x+this.settings.xScale.revisions.offset)}, ${this.scales.y(v.y)})`;
                        })
                        .each(function(v) {
                            for(const bauble of  self.settings.vertices.backgroundBaubles){
                                if (bauble.vertexFilter(v)) {
                                    bauble
                                        .update(select(this))
                                }
                            }
                        }),
                update => update
                    .call(update => update.transition()
                        .duration(this.settings.transition.transitionDuration)
                        .ease(this.settings.transition.transitionEase)
                        .attr("class", (v) => ["node-background", ...v.classes].join(" "))
                        .attr("transform", (v) => {
                            return `translate(${this.scales.x(v.x+this.settings.xScale.revisions.offset)}, ${this.scales.y(v.y)})`;
                        })
                        .each(function(v) {
                            for(const bauble of  self.settings.vertices.backgroundBaubles){
                                if (bauble.vertexFilter(v)) {
                                    bauble
                                        .update(select(this))
                                }
                            }
                        })
                    )
            );
        for(const callback of this.callbacks.nodes){
            callback();
        }
    }

    /**
     * Adds or updates branch lines
     */
    [p.updateBranches]() {

        const branchesLayer = this.svgSelection.select(".branches-layer");
        //set up scales for branches

        const edges = this[p.edges].data;
        const elementMap = this[p.edges].elementMap;

        // DATA JOIN
        // Join new data with old elements, if any.
        const self = this;
        branchesLayer.selectAll(".branch")
            .data(edges, (e) => `b_${e.key}`)
            .join(
                enter=>enter
                    .append("g")
                        .attr("id", (e) => e.key)
                        .attr("class", (e) => ["branch", ...e.classes].join(" "))
                        .attr("transform", (e) => {
                            return `translate(${this.scales.x(e.v0.x)}, ${this.scales.y(e.v1.y)})`;
                        })
                    .each(function(e) {
                        if(elementMap.has(e.key)){
                            const element = elementMap.get(e.key);
                            element.setup(self.scales);
                            element.update(select(this))
                        }
                    })
                    .append("text")
                        .attr("class", "branch-label")
                        .attr("dx", (e) => ((this.scales.x(e.v1.x) - this.scales.x(e.v0.x)) / 2))
                        .attr("dy", (e) => (e.labelBelow ? +6 : -6))
                        .attr("alignment-baseline", (e) => (e.labelBelow ? "hanging" : "bottom"))
                        .attr("text-anchor", "middle")
                        .text((e) => e.label),
                update => update
                    .call(update => update.transition()
                        .duration(this.settings.transition.transitionDuration)
                        .ease(this.settings.transition.transitionEase)
                        .attr("class", (e) => ["branch", ...e.classes].join(" "))
                        .attr("transform", (e) => {
                            return `translate(${this.scales.x(e.v0.x)}, ${this.scales.y(e.v1.y)})`;
                        })
                    .on("start",function(e) {
                        if(elementMap.has(e.key)){
                            const element = elementMap.get(e.key);
                            element.setup(self.scales);
                            element.update(select(this))
                        }

                    })
                        // .each(
                    .select("text .branch-label")
                            .attr("dx", (e) => ((this.scales.x(e.v1.x) - this.scales.x(e.v0.x)) / 2))
                            .attr("dy", (e) => (e.labelBelow ? +6 : -6))
                            .attr("alignment-baseline", (e) => (e.labelBelow ? "hanging" : "bottom"))
                            .attr("text-anchor", "middle")
                            .text((e) => e.label),
                    )
            );

        // add callbacks
        for(const callback of this.callbacks.branches){
            callback();
        }
    }

    [p.updateCartoons](){
        const cartoonLayer = this.svgSelection.select(".cartoon-layer");
        const self = this;
        cartoonLayer.selectAll("g .cartoon")
            .data(this.layout.cartoons, (c) => `c_${c.id}`)
            .join(
                enter=>enter
                    .append("g")
                        .attr("id", (c) => `cartoon-${c.id}`)
                        .attr("class", (c) => ["cartoon", ...c.classes].join(" "))
                        .attr("transform", (c) => {
                            return `translate(${this.scales.x(c.vertices[0].x+this.settings.xScale.revisions.offset)}, ${this.scales.y(c.vertices[0].y+this.settings.xScale.revisions.offset)})`;
                        })
                        .each(function(c) {
                            for(const bauble of  self.settings.cartoons.baubles){
                                if (bauble.cartoonFilter(c)) {
                                    bauble
                                        .update(select(this))
                                }
                            }
                        }),
                update=>update
                    .transition()
                    .duration(this.settings.transition.transitionDuration)
                    .ease(this.settings.transition.transitionEase)
                    .attr("class", (c) => ["cartoon", ...c.classes].join(" "))
                    .attr("transform", (c) => {
                        return `translate(${this.scales.x(c.vertices[0].x+this.settings.xScale.revisions.offset)}, ${this.scales.y(c.vertices[0].y+this.settings.xScale.revisions.offset)})`;
                    })
                    .each(function(c) {
                        for(const bauble of  self.settings.cartoons.baubles){
                            if (bauble.cartoonFilter(c)) {
                                bauble
                                    .update(select(this))
                            }
                        }
                    })
            );
        // add callbacks
        for(const callback of this.callbacks.cartoons){
            callback();
        }
    }

    /**
     * Add axis
     */
    [p.addXAxis]() {
        const xRevisions = this.settings.xScale.revisions;
        const reverse = xRevisions.reverseAxis? -1:1;
        const domain = xRevisions.origin!==null?
            [this.xScaleOrigin+xRevisions.hedge+reverse*xRevisions.branchScale*(Math.abs(this.scales.x.domain()[0]-this.scales.x.domain()[1])),this.xScaleOrigin]:
            this.scales.x.domain();
        const axisScale =  this.settings.xScale.scale().domain(domain).range(this.scales.x.range());

        const xAxisWidth = this.scales.width - this.margins.left - this.margins.right;
        const axesLayer = this.svgSelection.select(".axes-layer");

        this.settings.xScale.axes.forEach(axis=>{
            if(this.layout instanceof GeoLayout){
                throw new Error("Can not add axis to geolayout")
            }
            axis.createAxis({selection:axesLayer,
                x:0,
                y:this.scales.height - this.margins.bottom-this.margins.top +this.settings.xScale.gap,
                length:xAxisWidth,
                scale:axisScale})
        });
    }
 
    [p.addYAxis]() {
        const yRevisions = this.settings.yScale.revisions;
        const reverse = yRevisions.reverseAxis? -1:1;
        const domain = yRevisions.origin!==null?
            [this.yScaleOrigin+reverse*yRevisions.branchScale*(Math.abs(this.scales.y.domain()[0]-this.scales.y.domain()[1])),this.yScaleOrigin]:
            this.scales.y.domain();
        const axisScale =  this.settings.yScale.scale().domain(domain).range(this.scales.y.range());
        const yAxisHeight = this.scales.height - this.margins.top - this.margins.bottom;
        const axesLayer = this.svgSelection.select(".axes-layer");

        this.settings.yScale.axes.forEach(axis=>{
            if(this.layout instanceof GeoLayout){
                throw new Error("Can not add axis to geolayout")
            }
            axis.createAxis({selection:axesLayer,
                x:0-this.settings.yScale.gap,
                y:0,
                length:yAxisHeight,
                scale:axisScale})
        });
    }

    [p.updateXAxis](){
        const xRevisions = this.settings.xScale.revisions;
        const reverse = xRevisions.reverseAxis? -1:1;
        const domain = xRevisions.origin!==null?
            [this.xScaleOrigin+xRevisions.hedge+reverse*xRevisions.branchScale*(Math.abs(this.scales.x.domain()[0]-this.scales.x.domain()[1])),this.xScaleOrigin]:
            this.scales.x.domain();
        const axisScale =  this.settings.xScale.scale().domain(domain).range(this.scales.x.range());

        const xAxisWidth = this.scales.width - this.margins.left - this.margins.right;
        const axesLayer = this.svgSelection.select(".axes-layer");

        this.settings.xScale.axes.forEach(axis=>{
            axis.updateAxis({selection:axesLayer,
                x:0,
                y:this.scales.height - this.margins.bottom-this.margins.top +this.settings.xScale.gap,
                length:xAxisWidth,
                scale:axisScale})
        });
    }
    [p.updateYAxis](){
        const yRevisions = this.settings.yScale.revisions;
        const reverse = yRevisions.reverseAxis? -1:1;
        const domain = yRevisions.origin!==null?
            [this.yScaleOrigin+reverse*yRevisions.branchScale*(Math.abs(this.scales.y.domain()[0]-this.scales.y.domain()[1])),this.yScaleOrigin]:
            this.scales.y.domain();
        const axisScale =  this.settings.yScale.scale().domain(domain).range(this.scales.y.range());
        const yAxisHeight = this.scales.height - this.margins.top - this.margins.bottom;
        const axesLayer = this.svgSelection.select(".axes-layer");

        this.settings.yScale.axes.forEach(axis=>{
            axis.updateAxis({selection:axesLayer,
                x:0-this.settings.yScale.gap,
                y:0,
                length:yAxisHeight,
                scale:axisScale})
        });
    }

    [p.pointToPoint](points){
        let path = [];
        const origin = points[0];
        const pathPoints =points.reverse();
        let currentPoint =origin;
        for(const point of pathPoints){
            const xdiff = this.scales.x(point.x+this.settings.xScale.revisions.offset)-this.scales.x(currentPoint.x+this.settings.xScale.revisions.offset);
            const ydiff = this.scales.y(point.y)- this.scales.y(currentPoint.y);
            path.push(`${xdiff} ${ydiff}`);
            currentPoint = point;
        }
        return `M 0 0 l ${path.join(" l ")} z`;
    }

    [p.updateAnnotations](){
        for( const annotation of this._annotations){
            annotation();
        }
    }

    /**
     * Generates a line() function that takes an edge and it's index and returns a line for d3 path element. It is called
     * by the figtree class as
     * const branchPath = this.layout.branchPathGenerator(this.scales)
     * newBranches.append("path")
     .attr("class", "branch-path")
     .attr("d", (e,i) => branchPath(e,i));
     * @param scales
     * @param branchCurve
     * @return {function(*, *)}
     */

    [p.branchPathGenerator](){
        const branchPath =(e,i)=>{
            const branchLine = line()
                .x((v) => v.x)
                .y((v) => v.y)
                .curve(this.settings.edges.curve);
            const factor = e.v0.y-e.v1.y>0? 1:-1;
            const dontNeedCurve = e.v0.y-e.v1.y===0?0:1;
            const output = this.settings.edges.curveRadius>0?
                branchLine(
                    [{x: 0, y: this.scales.y(e.v0.y) - this.scales.y(e.v1.y)},
                        { x:0, y:dontNeedCurve*factor * this.settings.edges.curveRadius},
                        {x:0 + dontNeedCurve*this.settings.edges.curveRadius, y:0},
                        {x: this.scales.x(e.v1.x+this.settings.xScale.revisions.offset) - this.scales.x(e.v0.x+this.settings.xScale.revisions.offset), y: 0}
                    ]):
                branchLine(
                    [{x: 0, y: this.scales.y(e.v0.y) - this.scales.y(e.v1.y)},
                        {x: this.scales.x(e.v1.x+this.settings.xScale.revisions.offset) - this.scales.x(e.v0.x+this.settings.xScale.revisions.offset), y: 0}
                    ]);
            return(output)

        };
        return branchPath;
    }
// setters and getters

    svg(svg=null){
        if(svg===null){
            return this[p.svg]
        }
        else {
            this[p.svg] = svg;
            return this;
        }
        }
    tree(tree=null){
        if(tree===null){
            return this[p.tree]
        }else{
            this[p.tree] = tree;
            this[p.tree].subscribeCallback( () => {
                this.update();
            });
            return this;
        }
    }
    layout(layout=null){
        if(layout===null){
            return this[p.layout]
        }else{
            this[p.layout] = layout;
            return this;
        }
    }

    nodes(){
        if(!this[p.vertices]){
            this[p.updateVerticesAndEdges]();
        }
        return this[p.vertices]
    }
    branches(){
        if(!this[p.edges]){
            this[p.updateVerticesAndEdges]();
        }
        return this[p.edges]
    }

    get xAxis(){

    }
    get yAxis(){

    }

}


