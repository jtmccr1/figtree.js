"use strict";
import {select,selectAll,scaleLinear,axisBottom,mouse,event} from "d3";

/** @module figtree */
// const d3 = require("d3");

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
            xAxisTickArguments: [5, "f"],
            xAxisTitle: "Divergence",
            // nodeRadius: 6,
            hoverBorder: 2,
            backgroundBorder: 0,
            baubles: [],
            transitionDuration:500,
        };
    }
    static DEFAULT_STYLES(){
        return {"nodes":new Map(),"nodeBackgrounds":new Map(),"branches":new Map([["fill",d=>"none"],["stroke-width",d=>"2"],["stroke",d=>"black"]])}
    }

    /**
     * The constructor.
     * @param svg
     * @param layout - an instance of class Layout
     * @param margins
     * @param settings
     */
    constructor(svg, layout, margins, settings = {}) {
        this.layout = layout;
        this.margins = margins;

        // merge the default settings with the supplied settings
        const styles = FigTree.DEFAULT_STYLES();
        //update style maps
        if(settings.styles) {
            for (const key of Object.keys(styles)) {
                if (settings.styles[key]) {
                    styles[key] = new Map([...styles[key], ...settings.styles[key]])
                }
            }
        }

        this.settings = {...FigTree.DEFAULT_SETTINGS(), ...settings,...{styles:styles}};

        this.svg=svg;

    }
    draw(){
        
        // get the size of the svg we are drawing on
        let width,height;
        if(Object.keys(this.settings).indexOf("width")>-1){
            width =this. settings.width;
        }else{
            width = this.svg.getBoundingClientRect().width;
        }
        if(Object.keys(this.settings).indexOf("height")>-1){
            height =this.settings.height;
        }else{
            height = this.svg.getBoundingClientRect().height;
        }

        //remove the tree if it is there already
        select(this.svg).select("g").remove();

        // add a group which will contain the new tree
        select(this.svg).append("g")
            .attr("transform",`translate(${this.margins.left},${this.margins.top})`);

        //to selecting every time
        this.svgSelection = select(this.svg).select("g");

        this.svgSelection.append("g").attr("class", "axes-layer");
        this.svgSelection.append("g").attr("class", "branches-layer");
        if (this.settings.backgroundBorder > 0) {
            this.svgSelection.append("g").attr("class", "nodes-background-layer");
        }
        this.svgSelection.append("g").attr("class", "nodes-layer");

        // create the scales
        const xScale = scaleLinear()
            .domain(this.layout.horizontalRange)
            .range([this.margins.left, width - this.margins.right]);

        const yScale = scaleLinear()
            .domain(this.layout.verticalRange)
            .range([this.margins.top + 20, height -this.margins.bottom - 20]);

        this.scales = {x:xScale, y:yScale, width, height};
        addAxis.call(this, this.margins);

        this.vertices = [];
        this.edges = [];

        // Called whenever the layout changes...
        this.layout.updateCallback = () => {
            this.update();
        }

        this.update();
    }

    /**
     * Updates the tree when it has changed
     */
    update() {

        // get new positions
        this.layout.layout(this.vertices, this.edges);
        // svg may have changed sizes
        let width,height;
        if(Object.keys(this.settings).indexOf("width")>-1){
            width =this. settings.width;
        }else{
            width = this.svg.getBoundingClientRect().width;
        }
        if(Object.keys(this.settings).indexOf("height")>-1){
            height =this. settings.height;
        }else{
            height = this.svg.getBoundingClientRect().height;
        }

        // update the scales' domains
        this.scales.x.domain(this.layout.horizontalRange).range([this.margins.left, width - this.margins.right]);
        this.scales.y.domain(this.layout.verticalRange).range([this.margins.top + 20, height -this. margins.bottom - 20]);
        this.scales.width=width;
        this.scales.height=height;

        // updateAxis.call(this);
        const xAxis = axisBottom(this.scales.x)
            .tickArguments(this.settings.xAxisTickArguments);

        this.svgSelection.select("#x-axis")
            .transition()
            .duration(this.settings.transitionDuration)
            .call(xAxis);


        // call the private methods to create the components of the diagram
        updateBranches.call(this);

        if (this.settings.backgroundBorder > 0) {
            updateNodeBackgrounds.call(this);
        }

        updateNodes.call(this);

    }

    /**
     * set mouseover highlighting of branches
     */
    hilightBranches() {
        // need to use 'function' here so that 'this' refers to the SVG
        // element being hovered over.
        const selected = this.svgSelection.selectAll(".branch").select(".branch-path");
        selected.on("mouseover", function (d, i) {
            select(this).classed("hovered", true);

        });
        selected.on("mouseout", function (d, i) {
            select(this).classed("hovered", false);

        });
    }

    /**
     * Set mouseover highlighting of internal nodes
     */
    hilightInternalNodes() {
        this.hilightNodes(".internal-node");
    }

    /**
     * Set mouseover highlighting of internal nodes
     */
    hilightExternalNodes() {
        this.hilightNodes(".external-node");
    }

    /**
     * Set mouseover highlighting of nodes
     */
    hilightNodes(selection) {
        // need to use 'function' here so that 'this' refers to the SVG
        // element being hovered over.
        const self = this;
        const selected = this.svgSelection.selectAll(selection);
        selected.on("mouseover", function (d, i) {
            const node = select(this).select(".node-shape");
            self.settings.baubles.forEach((bauble) => {
                if (bauble.vertexFilter(node)) {
                    bauble.updateShapes(node, self.settings.hoverBorder);
                }
            });

            node.classed("hovered", true);
        });
        selected.on("mouseout", function (d, i) {
            const node = select(this).select(".node-shape");

            self.settings.baubles.forEach((bauble) => {
                if (bauble.vertexFilter(node)) {
                    bauble.updateShapes(node, 0);
                }
            });

            node.classed("hovered", false);
        });
    }

    /**
     * Registers action function to be called when an edge is clicked on. The function is passed
     * edge object that was clicked on and the position of the click as a proportion of the edge length.
     *
     * Optionally a selection string can be provided - i.e., to select a particular branch by its id.
     *
     * @param action
     * @param selection
     */
    onClickBranch(action, selection = null) {
        // We need to use the "function" keyword here (rather than an arrow) so that "this"
        // points to the actual SVG element (so we can use d3.mouse(this)). We therefore need
        // to store a reference to the object in "self".
        const self = this;
        const selected = this.svgSelection.selectAll(`${selection ? selection : ".branch"}`);
        selected.on("click", function (edge) {
            const x1 = self.scales.x(edge.v1.x);
            const x2 = self.scales.x(edge.v0.x);
            const mx = mouse(this)[0];
            const proportion = Math.max(0.0, Math.min(1.0, (mx - x2) / (x1 - x2)));
            action(edge, proportion);
        })
    }

    /**
     * Registers action function to be called when an internal node is clicked on. The function should
     * take the tree and the node that was clicked on.
     *
     * A static method - Tree.rotate() is available for rotating the node order at the clicked node.
     *
     * @param action
     */
    onClickInternalNode(action) {
        this.onClickNode(action, ".internal-node");
    }

    /**
     * Registers action function to be called when an external node is clicked on. The function should
     * take the tree and the node that was clicked on.
     *
     * @param action
     */
    onClickExternalNode(action) {
        this.onClickNode(action, ".external-node");
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
    onClickNode(action, selection = null) {
        const selected = this.svgSelection.selectAll(`${selection ? selection : ".node"}`).select(".node-shape");        
        selected.on("click", (vertex) => {
            action(vertex);
        })
    }
    /**
     * General Nodehover callback
     * @param {*} action and object with an enter and exit function
     * @param {*} selection defualts to ".node" will select this selection's child ".node-shape"
     */

    onHoverNode(action,selection=null){
        const selected = this.svgSelection.selectAll(`${selection ? selection : ".node"}`).select(".node-shape");        
        selected.on("mouseover", (vertex) => {
            action.enter(vertex);
        });
        selected.on("mouseout", (vertex) => {
            action.exit(vertex);
        });
    }

    /**
     * General branch hover callback
     * @param {*} action and object with an enter and exit function
     * @param {*} selection defualts to .branch
     */
    onHoverBranch(action,selection=null){ 
        // need to use 'function' here so that 'this' refers to the SVG
        // element being hovered over.
        const selected = this.svgSelection.selectAll(`${selection ? selection : ".branch"}`).select("branch-path");

        selected.on("mouseover", function (d, i) {
            action.enter(this);

        });
        selected.on("mouseout", function (d, i) {
            action.exit(this);

        });
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
    }

    set treeLayout(layout) {
        this.layout = layout;
        this.update();
    }
}

/*
 * Private methods, called by the class using the <function>.call(this) function.
 */

/**
 * Adds or updates nodes
 */
function updateNodes() {

    const nodesLayer = select(this.svg).select(".nodes-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
    const nodes = nodesLayer.selectAll(".node")
        .data(this.vertices, (v) => `n_${v.key}`);

    // ENTER
    // Create new elements as needed.
    const newNodes = nodes.enter().append("g")
        .attr("id", (v) => v.id)
        .attr("class", (v) => ["node", ...v.classes].join(" "))
        .attr("transform", (v) => {
            return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
        });

    // add the specific node shapes or 'baubles'
    this.settings.baubles.forEach((bauble) => {
        const d = bauble
            .createShapes(newNodes.filter(bauble.vertexFilter))
            .attr("class", "node-shape");
        bauble.updateShapes(d);
    });

    newNodes.append("text")
        .attr("class", "node-label name")
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "middle")
        .attr("dx", "12")
        .attr("dy", "0")
        .text((d) => d.rightLabel);

    newNodes.append("text")
        .attr("class", "node-label support")
        .attr("text-anchor", "end")
        .attr("dx", "-6")
        .attr("dy", d => (d.labelBelow ? -8 : +8))
        .attr("alignment-baseline", d => (d.labelBelow ? "bottom": "hanging" ))
        .text((d) => d.leftLabel);

    // update the existing elements
    nodes
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("class", (v) => ["node", ...v.classes].join(" "))
        .attr("transform", (v) => {
            return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
        });



    // update all the baubles
    this.settings.baubles.forEach((bauble) => {
        const d = nodes.select(".node-shape")
            .filter(bauble.vertexFilter)
            .transition()
            .duration(this.settings.transitionDuration);
        bauble.updateShapes(d)
    });

    nodes.select("text .node-label .name")
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("class", "node-label name")
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "middle")
        .attr("dx", "12")
        .attr("dy", "0")
        .text((d) => d.rightLabel);

    nodes.select("text .node-label .support")
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("alignment-baseline", d => (d.labelBelow ? "bottom": "hanging" ))
        .attr("class", "node-label support")
        .attr("text-anchor", "end")
        .attr("dx", "-6")
        .attr("dy", d => (d.labelBelow ? -8 : +8))
        .text((d) => d.leftLabel);

    // EXIT
    // Remove old elements as needed.
    nodes.exit().remove();

    updateNodeStyles.call(this);


}

function updateNodeBackgrounds() {

    const nodesBackgroundLayer = this.svgSelection.select(".nodes-background-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
    const nodes = nodesBackgroundLayer.selectAll(".node-background")
        .data(this.vertices, (v) => `nb_${v.key}`);

    // ENTER
    // Create new elements as needed.
    const newNodes = nodes.enter();

    // add the specific node shapes or 'baubles'
    this.settings.baubles.forEach((bauble) => {
        const d = bauble
            .createShapes(newNodes.filter(bauble.vertexFilter))
            .attr("class", "node-background")
            .attr("transform", (v) => {
                return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
            });

        bauble.updateShapes(d, this.settings.backgroundBorder);
    });

    // update all the existing elements
    this.settings.baubles.forEach((bauble) => {
        const d = nodes
            .filter(bauble.vertexFilter)
            .transition()
            .duration(this.settings.transitionDuration)
            .attr("transform", (v) => {
                return `translate(${this.scales.x(v.x)}, ${this.scales.y(v.y)})`;
            });
        bauble.updateShapes(d, this.settings.backgroundBorder)
    });

    // EXIT
    // Remove old elements as needed.
    nodes.exit().remove();

    updateNodeBackgroundStyles.call(this);

}


/**
 * Adds or updates branch lines
 */
function updateBranches() {

    const branchesLayer = this.svgSelection.select(".branches-layer");

    // a function to create a line path
    // const branchPath = d3.line()
    //     .x((v) => v.x)
    //     .y((v) => v.y)
    //     .curve(this.layout.branchCurve);
    const branchPath = this.layout.branchPathGenerator(this.scales)

    // DATA JOIN
    // Join new data with old elements, if any.
    const branches = branchesLayer.selectAll("g .branch")
        .data(this.edges, (e) => `b_${e.key}`);

    // ENTER
    // Create new elements as needed.
    const newBranches = branches.enter().append("g")
        .attr("id", (e) => e.id)
        .attr("class", (e) => ["branch", ...e.classes].join(" "))
        .attr("transform", (e) => {
            return `translate(${this.scales.x(e.v0.x)}, ${this.scales.y(e.v1.y)})`;
        })
    newBranches.append("path")
        .attr("class", "branch-path")
        .attr("d", (e,i) => branchPath(e,i));

    newBranches.append("text")
        .attr("class", "branch-label length")
        .attr("dx", (e) => ((this.scales.x(e.v1.x) - this.scales.x(e.v0.x)) / 2))
        .attr("dy", (e) => (e.labelBelow ? +6 : -6))
        .attr("alignment-baseline", (e) => (e.labelBelow ? "hanging" : "bottom"))
        .attr("text-anchor", "middle")
        .text((e) => e.label);

    // update the existing elements
    branches
        .transition()
        .duration(this.settings.transitionDuration)
        .attr("class", (e) => ["branch", ...e.classes].join(" "))
        .attr("transform", (e) => {
            return `translate(${this.scales.x(e.v0.x)}, ${this.scales.y(e.v1.y)})`;
        })

        .select("path")
        .attr("d", (e,i) => branchPath(e,i))

        .select("text .branch-label .length")
        .attr("class", "branch-label length")
        .attr("dx", (e) => ((this.scales.x(e.v1.x) - this.scales.x(e.v0.x)) / 2))
        .attr("dy", (e) => (e.labelBelow ? +6 : -6))
        .attr("alignment-baseline", (e) => (e.labelBelow ? "hanging" : "bottom"))
        .attr("text-anchor", "middle")
        .text((e) => e.label);

    // EXIT
    // Remove old elements as needed.
    branches
        .exit().remove();

    updateBranchStyles.call(this);
}

/**
 * Add axis
 */
function addAxis() {
    const xAxis = axisBottom(this.scales.x)
        .tickArguments(this.settings.xAxisTickArguments);

    const xAxisWidth = this.scales.width - this.margins.left - this.margins.right;

    const axesLayer = this.svgSelection.select(".axes-layer");

    axesLayer
        .append("g")
        .attr("id", "x-axis")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${this.scales.height - this.margins.bottom + 5})`)
        .call(xAxis);

    axesLayer
        .append("g")
        .attr("id", "x-axis-label")
        .attr("class", "axis-label")
        .attr("transform", `translate(${this.margins.left}, ${this.scales.height - this.margins.bottom})`)
        .append("text")
        .attr("transform", `translate(${xAxisWidth / 2}, 35)`)
        .attr("alignment-baseline", "hanging")
        .style("text-anchor", "middle")
        .text(this.settings.xAxisTitle);
}

/**
 * A function to update the annotatation layer of the tree
 */


function updateNodeStyles(){
    const nodesLayer = select(this.svg).select(".nodes-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
    const nodes = nodesLayer.selectAll(".node .node-shape");
    const nodeAttrMap = this.settings.styles.nodes;
    for(const key of nodeAttrMap.keys()){
        nodes
            // .transition()
            // .duration(this.settings.transitionDuration)
            .attr(key,d=>nodeAttrMap.get(key)(d.node))
    }


}

function updateNodeBackgroundStyles(){
    const nodesBackgroundLayer = this.svgSelection.select(".nodes-background-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
    const nodes = nodesBackgroundLayer.selectAll(".node-background")

    const nodeBackgroundsAttrMap = this.settings.styles.nodeBackgrounds;
    for(const key of nodeBackgroundsAttrMap.keys()){
        nodes
            // .transition()
            // .duration(this.settings.transitionDuration)
            .attr(key,d=>nodeBackgroundsAttrMap.get(key)(d.node))
    }

}

function updateBranchStyles(){
    const branchesLayer = this.svgSelection.select(".branches-layer");

    // DATA JOIN
    // Join new data with old elements, if any.
    const branches = branchesLayer.selectAll("g .branch .branch-path")

    const branchAttrMap = this.settings.styles["branches"];
    for(const key of branchAttrMap.keys()){
        branches
            // .transition()
            // .duration(this.settings.transitionDuration)
            .attr(key,d=>branchAttrMap.get(key)(d.v1.node))
    }

}