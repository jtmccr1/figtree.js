"use strict";

/** @module tree */

import {v4} from "uuid";
import {timeParse} from "d3-time-format";
import {maxIndex, max} from "d3-array";
import {dateToDecimal} from "../utilities";
// import * as BitSetModule from "bitset";
// const BitSet =BitSetModule.__moduleExports;
// for unique node ids
export const Type = {
    DISCRETE : Symbol("DISCRETE"),
    BOOLEAN : Symbol("BOOLEAN"),
    INTEGER : Symbol("INTEGER"),
    FLOAT: Symbol("FLOAT"),
    PROBABILITIES: Symbol("PROBABILITIES"),
};

/**
 * The Tree class
 */
export class Tree {

    static DEFAULT_SETTINGS() {
        return {
            lengthsKnown:true,
            heightsKnown:false,
        }
    }
    /**
     * The constructor takes an object for the root node. The tree structure is
     * defined as nested node objects.
     *
     * @constructor
     * @param {object} rootNode - The root node of the tree as an object.
     */
    constructor(heightsKnown=false) {

        //TODO make private things private with symbols

        this.heightsKnown = heightsKnown;
        this.lengthsKnown = !heightsKnown;
        // this._root = makeNode.call(this,{...rootNode,...{length:0,level:0}});
        // This converts all the json objects to Node instances
        // setUpNodes.call(this,this.root);
        this.annotations = {};
        // for(const node of this.preorder()){
        //     if (node.label && node.label.startsWith("#")) {
        //         // an id string has been specified in the newick label.
        //         node._id = node.label.substring(1);
        //     }
        //     this.addAnnotations(node.annotations);
        //     this._nodeMap.set(node.id, node);
        // }

        this._tipMap = new Map();
        this._nodeMap=new Map();
        this._labelMap = new Map();
        this.nodesUpdated = false;
        // a callback function that is called whenever the tree is changed
        this._shouldUpdate=true

    };
    treeUpdateCallback(){};
    /**
     * Gets the root node of the Tree
     *
     * @returns {Object|*}
     */
    get root() {
        return this._root;
    };

    set root(node){
        this._root=node;
    }

    /**
     * Gets an array containing all the node objects
     *
     * @returns {*}
     */
    get nodes() {
        return [...this.preorder()];
    };

    /**
     * get array of node list
     * @returns {*}
     */
    //TODO remove
    get nodeList(){
        return this.nodes
    }

    /**
     * Gets an array containing all the external node objects
     *
     * @returns {*}
     */
    get externalNodes() {
        return this.nodes.filter((node) => !node.children);
    };



    /**
     * Gets an array containing all the internal node objects
     *
     * @returns {*}
     */
    get internalNodes() {
        return this.nodes.filter((node) => node.children );
    };

    get nodeMap(){
        return this._nodeMap ;
    }
    get tipMap(){
        return this._tipMap ;
    }

    /**
     * Returns the sibling of a node (i.e., the first other child of the parent)
     *
     * @param node
     * @returns {object}
     */
    getSibling(node) {
        if (!node.parent) {
            return null;
        }
        return node.parent.children.find((child) => child !== node);
    }

    /**
     * Returns a node from its id stored.
     *
     * @param id
     * @returns {object}
     */
    getNode(id) {
        return this.nodeMap.get(id);
    }

    /**
     * Returns an external node (tip) from its name.
     *
     * @param name
     * @returns {object}
     */
    getExternalNode(name) {
        return this.tipMap.get(name);
    }
    /**
     * Returns an external node (tip) from its label.
     *
     * @param name
     * @returns {object}
     */
    getInternalNode(label){
        return this._labelMap.get(label)
    }

    /**
     * If heights are not currently known then calculate heights for all nodes
     * then return the height of the specified node.
     * @param node
     * @returns {number}
     */
    getHeight(node) {
        return node.height;
    }

    /**
     * A generator function that returns the nodes in a pre-order traversal.
     *
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *preorder(startNode=this.root,filter=()=>true) {
        const traverse = function *(node,filter) {
            if(filter(node)) {
                yield node;
                if (node.children!=null) {
                    for (const child of node.children) {
                        yield* traverse(child, filter);
                    }
                }
            }
        };

        yield* traverse(startNode,filter);
    }

    /**
     * A generator function that returns the nodes in a post-order traversal
     *
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    *postorder(startNode=this.root,filter=()=>true) {
        const traverse = function *(node,filter) {
            if(filter(node)) {
                if (node.children!=null) {
                    for (const child of node.children) {
                        yield* traverse(child, filter);
                    }
                }
                yield node;
            }
        };

        yield* traverse(startNode,filter);
    }

    /**
     * A generator function that returns the nodes in a path to the root
     *
     * @returns {IterableIterator<IterableIterator<*|*>>}
     */
    static* pathToRoot(node) {
        while (node) {
            yield node;
            node = node.parent;
        }
    }

    /**
     * An instance method to return a Newick format string for the Tree. Can be called without a parameter to
     * start at the root node. Providing another node will generate a subtree. Labels and branch lengths are
     * included if available.
     *
     * @param {object} node - The node of the tree to be written (defaults as the root).
     * @returns {string}
     */
    toNewick(node = this.root) {
       
        function oneLiner(node){ return (node.children ? `(${node.children.map(child => oneLiner(child)).join(",")})${node.label ? '#'+node.label : ""}` : node.name) + (node.length ? `:${node.length}` : "")};

        return  (oneLiner(node) + ";");
    };

    /**
     * Re-roots the tree at the midway point on the branch above the given node.
     *
     * @param {object} node - The node to be rooted on.
     * @param proportion - proportion along the branch to place the root (default 0.5)
     */
    reroot(node, proportion = 0.5) {
        if (node === this.root) {
            // the node is the root - nothing to do
            return;
        }

        const rootLength = this.root.children[0].length + this.root.children[1].length;


        const rootChild1 = node;
        const rootChild2 = node.parent;
        const nodeAtTop = node.parent.children[0] === node;

        if (node.parent !== this.root) {
            // the node is not a child of the existing root so the root is actually changing
            let node0 = node;
            let parent = node.parent;
            let gp = parent.parent;

            // was the node the first child in the parent's children?

            let oldLength = parent.length;
            let i=0;
            let done=false;
            parent.removeChild(node0)

            while (!done) {
                if (gp === this.root) {
                    //root should only have 1 child or we arive right away and need to get the sibling
                    const sibling = this.root.children.length===1? this.root.children[0]:this.getSibling(parent) ;
                    gp.removeChild(sibling);
                    gp.removeChild(parent); // just ncase we got here right away
                    parent.addChild(sibling)
                    // parent._children.push(sibling);
                    sibling._length = rootLength;
                    done = true
                }else {

                    let tmpGP = gp.parent;
                    gp.removeChild(parent);
                    gp.parent.removeChild(gp);
                    parent.addChild(gp)
                    // swap the parent and parent's parent's length around
                    let tmp = gp._length;
                    gp._length = oldLength;
                    oldLength = tmp;
                    // [gp._length, oldLength] = [oldLength, gp._length];

                    node0 = parent;
                    parent = gp;
                    gp = tmpGP;

                    // remove the node that will becoming the parent from the children
                    // parent._children = parent.children.filter((child) => child !== node0);

                }

            }

            // Reuse the root node as root...

            // Set the order of the children to be the same as for the original parent of the node.
            // This makes for a more visually consistent rerooting graphically.

            if(nodeAtTop){
                this.root.addChild(rootChild1);
                this.root.addChild(rootChild2);
            }else{
                this.root.addChild(rootChild2);
                this.root.addChild(rootChild1);
            }

            const l = rootChild1.length * proportion;
            rootChild2._length = l;
            rootChild1._length = rootChild1.length - l;

        } else {
            // the root is staying the same, just the position of the root changing
            const l = node.length * (1.0 - proportion);
            node._length = l;
            this.getSibling(node)._length = rootLength - l;
        }

        this.heightsKnown = false;
        this.treeUpdateCallback();
    };

    /**
     * Reverses the order of the children of the given node. If 'recursive=true' then it will
     * descend down the subtree reversing all the sub nodes.
     *
     * @param node
     * @param recursive
     */
    rotate(node, recursive = false) {
        if (node.children) {
            if (recursive) {
                for (const child of node.children) {
                    this.rotate(child, recursive);
                }
            }
            node._children.reverse();
        }

        this.treeUpdateCallback();
    };

    /**
     * Sorts the child branches of each node in order of increasing or decreasing number
     * of tips. This operates recursively from the node given.
     *
     * @param node - the node to start sorting from
     * @param {boolean} increasing - sorting in increasing node order or decreasing?
     * @returns {Tree} - the number of tips below this node
     */


    orderByNodeDensity(increasing = true, node = this.root) {
        const factor = increasing ? 1 : -1;
        orderNodes.call(this, node, (nodeA, countA, nodeB, countB) => {
            return (countA - countB) * factor;
        });
        this.treeUpdateCallback();
        return this;
    }

    /**
     * Sorts the child branches of each node in order given by the function. This operates
     * recursively from the node given.
     * recursively from the node given.
     *
     * @param node - the node to start sorting from
     * @param {function} ordering - provides a pairwise sorting order.
     *  Function signature: (nodeA, childCountNodeA, nodeB, childCountNodeB)
     * @returns {Tree} - the number of tips below this node
     */
    order(ordering, node = this.root) {
        orderNodes.call(this, node, ordering);
        this.treeUpdateCallback();
        return this;
    }
    _order(ordering, node = this.root) {
        orderNodes.call(this, node, ordering);
        return this;
    }

    /**
     * Get the last common ancestor of two nodes.
     * @param node1
     * @param node2
     * @returns {IterableIterator<*>}
     */
    lastCommonAncestor(node1, node2) {

        const path1 = [...Tree.pathToRoot(node1)];
        const path2 = [...Tree.pathToRoot(node2)];
      
        const sharedAncestors = path1.filter(n1=>path2.map(n2=>n2.id).indexOf(n1.id)>-1);
        return sharedAncestors[maxIndex(sharedAncestors, node => node.level)];
      
    }

    /**
     * Get the path length between two nodes
     * @param node1
     * @param node2
     * @returns {number}
     */
    pathLength(node1, node2) {

        let sum = 0;
        
        const mrca = this.lastCommonAncestor(node1,node2);
        for(let node of [node1,node2]){
            while(node!=mrca){
              sum+=node.length;
              node=node.parent;
            }
        }
        
        return sum;
    }

    /**
     * Returns a new tree instance with  only the nodes provided and the path to their MRCA. After this traversal, unspecified
     * degree two nodes will be removed. The subtree will consist of the root and then the last common ancestor.
     * The nodes of the new tree will be copies of the those in the original, but they will share
     * ids, annotations, and names.
     * @param chosenNodes
     * @return {Tree}
     */
    subTree(chosenNodes){

        const sharedNodes = [...chosenNodes.map(node=>[...Tree.pathToRoot(node)])] // get all the paths to the root
            .reduce((acc,curr)=> [...acc,...curr],[]) // unpack the paths
            .filter((node,i,all)=> all.filter(x=>x===node).length===chosenNodes.length)        // filter to nodes that appear in every path
            .reduce((acc,curr)=> { // reduce to the unique set.
                if(!acc.includes(curr)){
                    acc.push(curr)
                }
                return acc;
            },[]);

        const mrca = sharedNodes[maxIndex(sharedNodes,n=>n.level)];

        // intermediate nodes with show up as
        const subtree = new Tree(mrca.toJS());


        subtree.externalNodes.forEach(node=>{
                    if(!chosenNodes.map(n=>n.id).includes(node.id)){
                        subtree.removeNode(node);
                    }
                });

        return subtree;
    }


    /**
     * Gives the distance from the root to a given tip (external node).
     * @param tip - the external node
     * @returns {number}
     */
    rootToTipLength(tip) {
        let length = 0.0;
        for (const node of Tree.pathToRoot(tip)) {
            if (node.length) {
                length += node.length;
            }
        }
        return length;
    }

    /**
     * Returns an array of root-to-tip distances for each tip in the tree.
     * @returns {*}
     */
    rootToTipLengths() {
        return this.externalNodes.map((tip) => this.rootToTipLength(tip));
    }

    /**
     * Splits each branch in multiple segments inserting a new degree 2 nodes. If splitLocations is
     * null then it splits each in two at the mid-point
     * @param splits
     */
    splitBranches(splits = null) {
        // split each branch into sections, with a node of
        // degree two in the middle. This allows annotation
        // of part of a branch.
        [...this.preorder()]
            .filter((node) => node.parent)
            .forEach((node) => {
                if (splits !== null) {
                    if (splits[node.id]) {
                        let splitNode = node;
                        splits[node.id].forEach(([time, id]) => {
                            splitNode = this.splitBranch(splitNode, time);
                            splitNode._id = id;
                        })
                    }
                } else {
                    // if no splitLocations are given then split it in the middle.
                    this.splitBranch(node, 0.5);
                }
            });
        this.nodesUpdated=true;
        this.treeUpdateCallback();

    }

    /**
     * Splits a branch in two inserting a new degree 2 node. The splitLocation should be less than
     * the orginal branch length.
     * @param node
     * @param splitLocation - proportion of branch to split at.
     */
    splitBranch(node, splitLocation=0.5) {
        const oldLength = node.length;

        const splitNode = this.addNode(
            {
            length: oldLength*splitLocation,
            annotations: {
                insertedNode: true
            }
        });
        if (node.parent) {
            node.parent.addChild(splitNode);
            node.parent.removeChild(node);
        } else {
            // node is the root so make splitNode the root
            this.root = splitNode;
        }
        splitNode.addChild(node)

        node._length = oldLength-splitNode.length;
        this.nodesUpdated=true;
        this.heightsKnown=false;
        return splitNode;
    }

    /**
     * Deletes a node from the tree. if the node had children the children are linked to the
     * node's parent. This could result in a multifurcating tree.
     * The root node can not be deleted.
     * @param node
     */
    removeNode(node){
        if(node===this.root){
            return;
        }
        // remove the node from it's parent's children
        const parent = node.parent;
        node.parent.removeChild(node);
        //update child lengths
        if(node.children){
        node.children.forEach(child=>{
            child._length += node.length;
            child.parent = parent;
            parent.addChild(child);
            })
        }else{
            if(node.name){
                this._tipMap.delete(node.name);
            }
        }
        this._nodeMap.delete(node._id);
        // if(parent._children.length===1){
        //     console.log("removing parent")
        //     this.removeNode(node.parent); // if it's a tip then remove it's parent which is now degree two;
        // }
        this.nodesUpdated = true;
    }

    addNode(nodeData={},external=false){
        const node = new Node({...nodeData, tree:this});
        this._nodeMap.set(node.id, node);
        if(external){
            if(node.name===null){
                throw new Error("tips need names");

            }
            if(this._tipMap.has(node.name)){
                throw new Error("${node.name} already in tree");
            }
            this._tipMap.set(node.name, node);
        }
        return node;
    }

    /**
     * deletes a node and all it's descendents from the tree;
     * @param node
     * @return {*}
     */
    removeClade(node) {
        if(node===this.root){
            return;
        }
        for(const descendent of this.postorder(node)){
            this.removeNode(descendent)
        }
        this.nodesUpdated=true;
        this.treeUpdateCallback();
        return this;
    }

    /**
     * Set one or more annotations for the tips.
     *
     * See annotateNode for a description of the annotation structure.
     *
     * @param annotations a dictionary of annotations keyed by tip label
     */
    annotateTips(annotations) {
        for (let [key, values] of Object.entries(annotations)) {
            const tip = this.getExternalNode(key);
            if (!tip) {
                throw new Error(`tip with label ${key} not found in tree`);
            }

            this.annotateNode(tip, values);
        }
        this.treeUpdateCallback();
    }

    /**
     * This is similar to annotateTips but the annotation objects are keyed by node
     * keys (Symbols).
     *
     * @param annotations a dictionary of annotations keyed by node key
     */
    annotateNodes(annotations) {
        for (let [key, values] of Object.entries(annotations)) {
            const node = this.getNode(key);
            if (!node) {
                throw new Error(`tip with key ${key} not found in tree`);
            }

            this.annotateNode(node, values);
        }
        this.treeUpdateCallback();

    }

    /**
     * Adds the given annotations to a particular node object.
     *
     * The annotations is an object with properties keyed by external node labels each
     * of which is an object with key value pairs for the annotations. The
     * key value pairs will be added to a property called 'annotations' in the node.
     *
     * Boolean or Numerical traits are given as a single value.
     * Sets of values with probabilities should be given as an object.
     * Discrete values should be given as an array (even if containing only one value)
     * or an object with booleans to give the full set of possible trait values.
     *
     * For example:
     *
     * {
     *     'tip_1': {
     *         'trait_1' : true,
     *         'trait_4' : 3.141592,
     *         'trait_2' : [1, 2], // discrete trait
     *         'trait_3' : ["London", "Paris", "New York"], // discrete trait
     *         'trait_3' : {"London" : true, "Paris" : false, "New York": false], // discrete trait with full set of values
     *         'trait_4' : {"London" : 0.75, "Paris" : 0.20, "New York": 0.05} // probability set
     *     },
     *     'tip_2': {...}
     * }
     *
     * The annotation labels, type and possible values are also added to the tree in a property called 'annotations'.
     *
     * A reconstruction method such as annotateNodesFromTips can then be used to provide reconstructed values
     * for internal nodes. Or annotateNodes can provide annotations for any node in the tree.
     *
     * @param node
     * @param annotations a dictionary of annotations keyed by the annotation name.
     */
    annotateNode(node, annotations) {
        this._addAnnotations(annotations);

        // add the annotations to the existing annotations object for the node object
        node._annotations = {...(node.annotations === undefined ? {} : node.annotations), ...annotations};
    }

    /**
     * Adds the annotation information to the tree. This stores the type and possible values
     * for each annotation seen in the nodes of the tree.
     *
     * This methods also checks the values are correct and conform to previous annotations
     * in type.
     *
     * @param annotations
     */
    _addAnnotations(annotations) {
        for (let [key, addValues] of Object.entries(annotations)) {
            let annotation = this.annotations[key];
            if (!annotation) {
                annotation = {};
                this.annotations[key] = annotation;
            }

            if (Array.isArray(addValues)) {
                // is a set of  values
                let type;
                if(addValues.map(v=>isNaN(v)).reduce((acc,curr)=>acc&&curr,true)) {
                    type = Type.DISCRETE;
                    annotation.type = type;
                    if (!annotation.values) {
                        annotation.values = new Set();
                    }
                    annotation.values.add(...addValues);
                }else if(addValues.map(v=>parseFloat(v)).reduce((acc,curr)=>acc&&Number.isInteger(curr),true)){
                    type =Type.INTEGER;
                }else if(addValues.map(v=>parseFloat(v)).reduce((acc,curr)=>acc&&!Number.isInteger(curr),true)){
                    type = Type.FLOAT;
                }

                if (annotation.type && annotation.type !== type) {
                    if ((type === Type.INTEGER && annotation.type === Type.FLOAT) ||
                        (type === Type.FLOAT && annotation.type === Type.INTEGER)) {
                        // upgrade to float
                        type = Type.FLOAT;
                        annotation.type = Type.FLOAT;
                        if(annotation.values){
                            delete annotation.values;
                    }else{
                            throw Error(`existing values of the annotation, ${key}, in the tree is discrete.`);
                        }
                    }
                }

                // annotation.values = annotation.values? [...annotation.values, ...addValues]:[...addValues]
            } else if (Object.isExtensible(addValues)) {
                // is a set of properties with values
                let type = null;

                let sum = 0.0;
                let keys = [];
                for (let [key, value] of Object.entries(addValues)) {
                    if (keys.includes(key)) {
                        throw Error(`the states of annotation, ${key}, should be unique`);
                    }
                    if (typeof value === typeof 1.0) {
                        // This is a vector of probabilities of different states
                        type = (type === undefined) ? Type.PROBABILITIES : type;

                        if (type === Type.DISCRETE) {
                            throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                        }

                        sum += value;
                        if (sum > 1.01) {
                            throw Error(`the values of annotation, ${key}, should be probabilities of states and add to 1.0`);
                        }
                    } else if (typeof value === typeof true) {
                        type = (type === undefined) ? Type.DISCRETE : type;

                        if (type === Type.PROBABILITIES) {
                            throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                        }
                    } else {
                        throw Error(`the values of annotation, ${key}, should be all boolean or all floats`);
                    }
                    keys.push(key);
                }

                if (annotation.type && annotation.type !== type) {
                    throw Error(`existing values of the annotation, ${key}, in the tree is not of the same type`);
                }

                annotation.type = type;
                annotation.values = annotation.values? [...annotation.values, addValues]:[addValues]
            } else {
                let type = Type.DISCRETE;

                if (typeof addValues === typeof true) {
                    type = Type.BOOLEAN;
                } else if (!isNaN(addValues)) {
                    type = (addValues % 1 === 0 ? Type.INTEGER : Type.FLOAT);
                }

                if (annotation.type && annotation.type !== type) {
                    if ((type === Type.INTEGER && annotation.type === Type.FLOAT) ||
                        (type === Type.FLOAT && annotation.type === Type.INTEGER)) {
                        // upgrade to float
                        type = Type.FLOAT;
                    } else {
                        throw Error(`existing values of the annotation, ${key}, in the tree is not of the same type`);
                    }
                }

                if (type === Type.DISCRETE) {
                    if (!annotation.values) {
                        annotation.values = new Set();
                    }
                    annotation.values.add(addValues);
                }

                annotation.type = type;
            }

            // overwrite the existing annotation property
            this.annotations[key] = annotation;
        }
    }

    /**
     * Uses parsimony to label internal nodes to reconstruct the internal node states
     * for the annotation 'name'.
     *
     * @param name
     * @param acctrans Use acctrans reconstruction if true, deltrans otherwise
     * @param node
     */
    annotateNodesFromTips(name, acctran = true) {
        fitchParsimony(name, this.root);

        reconstructInternalStates(name, [], acctran, this.root);

        this.treeUpdateCallback();

    }

    /**
     * A class function that subscribes a to be called when the tree updates.
     * @param func - function to be called when the tree updates
     */
    subscribeCallback(func){
        const currentCallback = this.treeUpdateCallback;
        this.treeUpdateCallback = ()=>{
            if(!this._shouldUpdate){return}
            currentCallback();
            func();
        }
    }

    getClades(tipNameMap=null){
            return  this.nodeList.filter(n=>n.parent).map(node=>node.getClade(tipNameMap));
    }

    batchUpdateOn(){
        this._shouldUpdate=false;
    }
    batchUpdateOff(){
        this._shouldUpdate=true;
        this.treeUpdateCallback()
    }
    /**
     * A class method to create a Tree instance from a Newick format string (potentially with node
     * labels and branch lengths). Taxon labels should be quoted (either " or ') if they contain whitespace
     * or any of the tree definitition characters '(),:;' - the quotes (and any whitespace immediately within)
     * will be removed.
     * @param newickString - the Newick format tree as a string
     * @param labelName
     * @param datePrefix
     * @returns {Tree} - an instance of the Tree class
     */
    static parseNewick(newickString, options={}) {
        options ={...{labelName: "label",datePrefix:undefined,dateFormat:"decimal",tipNameMap:null},...options}

        const tokens = newickString.split(/\s*('[^']+'|"[^"]+"|;|\(|\)|,|:|=|\[&|\]|\{|\})\s*/);
        let level = 0;
        let currentNode = null;
        let nodeStack = [];
        let labelNext = false;
        let lengthNext = false;
        let inAnnotation = false;
        let annotationKeyNext = true;
        let annotationKey;
        let isAnnotationARange=false;
        let annotations={};
        const tree = new Tree();

        for (const token of tokens.filter(token => token.length > 0)) {
            // console.log(`Token ${i}: ${token}, level: ${level}`);
            if(inAnnotation){
                if(token==="="){
                    annotationKeyNext=false;
                }else if(token===","){
                    if(!isAnnotationARange){
                        annotationKeyNext=true;
                    }
                }else if (token==="{"){
                    isAnnotationARange=true;
                    annotations[annotationKey]=[];
                }else if (token==="}"){
                    isAnnotationARange=false
                }
                else if(token ==="]"){
                    // close BEAST annotation
                    inAnnotation = false;
                    annotationKeyNext = true;
                    tree.annotateNode(currentNode, annotations);
                    annotations={};
                } else{
                    // must be annotation
                    // remove any quoting and then trim whitespace
                    let annotationToken = token;
                    if (annotationToken.startsWith("\"") || annotationToken.startsWith("'")) {
                        annotationToken = annotationToken.substr(1);
                    }
                    if (annotationToken.endsWith("\"") || annotationToken.endsWith("'")) {
                        annotationToken = annotationToken.substr(0, annotationToken.length - 1);
                    }
                    if(annotationKeyNext) {
                        annotationKey = annotationToken.replace(".","_");
                    }else{
                        if(isAnnotationARange){
                            annotations[annotationKey].push(annotationToken);
                        }else{
                            if(isNaN(annotationToken)){
                                annotations[annotationKey]=annotationToken;

                            }else{
                                annotations[annotationKey] = parseFloat((annotationToken));
                            }
                        }
                    }
                }

            } else if (token === "(") {
                // an internal node

                if (labelNext) {
                    // if labelNext is set then the last bracket has just closed
                    // so there shouldn't be an open bracket.
                    throw new Error("expecting a comma");
                }

                let node = tree.addNode();

                level += 1;
                if (currentNode) {
                    nodeStack.push(currentNode);
                }else{
                    tree.root=node;
                }
                currentNode = node;

            } else if (token === ",") {
                // another branch in an internal node

                labelNext = false; // labels are optional
                if (lengthNext) {
                    throw new Error("branch length missing");
                }

                let parent = nodeStack.pop();
                parent.addChild(currentNode);

                currentNode = parent;
            } else if (token === ")") {
                // finished an internal node

                labelNext = false; // labels are optional
                if (lengthNext) {
                    throw new Error("branch length missing");
                }

                // the end of an internal node
                let parent = nodeStack.pop();
                if(parent === undefined){
                    throw new Error( "the brackets in the newick file are not balanced: too many closed")
                }
                parent.addChild(currentNode);
                
                level -= 1;

                currentNode = parent;

                labelNext = true;
            } else if (token === ":") {
                labelNext = false; // labels are optional
                lengthNext = true;
            } else if (token === ";") {
                // end of the tree, check that we are back at level 0
                if (level > 0) {
                    throw new Error("the brackets in the newick file are not balanced: too many opened")
                }
                break;
            } else if(token ==="[&") {
                inAnnotation=true;
            }
            else {
                // not any specific token so may be a label, a length, or an external node name
                if (lengthNext) {
                    currentNode.length = parseFloat(token);
                    lengthNext = false;
                } else if (labelNext) {


                    // currentNode.label = token;
                    const label = token;
                    if (!label.startsWith("#")) {
                        let value = parseFloat(label);
                        if (isNaN(value)) {
                            value = label;
                        }
                        let label_annotation={};
                        label_annotation[options.labelName] = value;
                        tree.annotateNode(currentNode,label_annotation)
                    }else{
                        currentNode.label = label.replace(/^#/,''); // remove hash if present
                    }
                    labelNext = false;
                } else {

                    let name = options.tipNameMap?options.tipNameMap.get(token):token;

                    // remove any quoting and then trim whitespace
                    if (name.startsWith("\"") || name.startsWith("'")) {
                        name = name.substr(1);
                    }
                    if (name.endsWith("\"") || name.endsWith("'")) {
                        name = name.substr(0, name.length - 1);
                    }
                    name = name.trim();

                    let decimalDate = undefined;
                    let date = undefined;
                    if (options.datePrefix) {
                        const parts = name.split(options.datePrefix);
                        if (parts.length === 0) {
                            throw new Error(`the tip, ${name}, doesn't have a date separated by the prefix, '${options.datePrefix}'`);
                        }
                        const dateBit = parts[parts.length-1];
                        if(options.dateFormat==="decimal"){
                            decimalDate = parseFloat(parts[parts.length - 1]);
                        }else{
                            date = timeParse(options.dateFormat)(dateBit);
                            if(!date){
                                date = timeParse(options.dateFormat)(`${dateBit}-15`)
                            }
                            if(!date){
                                date = timeParse(options.dateFormat)(`${dateBit}-06-15`)
                            }
                            decimalDate = dateToDecimal(date);
                        }

                    }

                    const externalNode = tree.addNode( {name: name.replace(/\'/g,'')},
                        true);
                    if(decimalDate!==null){
                        tree.annotateNode(externalNode,{ date: decimalDate })
                    }

                    if (currentNode) {
                        nodeStack.push(currentNode);
                    }
                    currentNode = externalNode;
                }
            }
        }

        if (level > 0) {
            throw new Error("the brackets in the newick file are not balanced")
        }
        return tree;
    };

    /*

     */
    //TODO make return first tree only unless stated otherwise
   static  parseNexus(nexus,options={}){

        const trees=[];

       // odd parts ensure we're not in a taxon label
       //TODO make this parsing more robust
       const nexusTokens = nexus.split(/\s*(?:\bBegin\s+|\bbegin\s+|\bBEGIN\s+|\bend\s*;|\bEnd\s*;|\bEND\s*;)\s*/).filter(d=> d!=="")
       const firstToken = nexusTokens.shift().trim();
       if(firstToken.toLowerCase()!=='#nexus'){
            throw Error("File does not begin with #NEXUS is it a nexus file?")
        }
        for(const section of nexusTokens){
            const workingSection = section.replace(/^\s+|\s+$/g, '').split(/\n/);
            const sectionTitle = workingSection.shift();
            if(sectionTitle.toLowerCase().trim() ==="trees;"){
                let inTaxaMap=false;
                const tipNameMap = new Map();
                for(const token of workingSection){
                    if(token.trim().toLowerCase()==="translate"){
                        inTaxaMap=true;
                    }else{
                        if(inTaxaMap){
                            if(token.trim()===";"){
                                inTaxaMap=false;
                            }else{
                                const taxaData = token.trim().replace(",","").split(/\s*\s\s*/);
                                tipNameMap.set(taxaData[0],taxaData[1]);
                            }
                        }else{
                                const treeString = token.substring(token.indexOf("("));
                            if(tipNameMap.size>0) {
                                const thisTree = Tree.parseNewick(treeString, {...options, tipNameMap: tipNameMap});
                                trees.push(thisTree);
                            }else{
                                const thisTree = Tree.parseNewick(treeString, {...options});
                                trees.push(thisTree);
                            }
                        }
                    }
                }
            }

        }
        return trees;
    }

}

/*
 * Private methods, called by the class using the <function>.call(this) function.
 */

/**
 * A private recursive function that rotates nodes to give an ordering provided
 * by a function.
 * @param node
 * @param ordering function that takes (a,number of tips form a, b, number of tips from b) and sorts a and be by the output.
 * @param callback an optional callback that is called each rotate
 * @returns {number}
 */
function orderNodes(node, ordering, callback = null) {
    let count = 0;
    if (node.children) {
        // count the number of descendents for each child
        const counts = new Map();
        for (const child of node.children) {
            const value = orderNodes(child, ordering, callback);
            counts.set(child.id, value);
            count += value;
        }
        // sort the children using the provided function
      node._children.sort((a, b) => {
            return ordering(a, counts.get(a), b, counts.get(b), node)
        })

        if (callback) callback();
    } else {
        count = 1
    }
    return count;
}

/**
 * A private recursive function that calculates the height of each node (with the most
 * diverged tip from the root having height given by origin).
 */
//TODO bug in node height when in observable
function calculateHeights(tree) {

    const maxRTT = max(tree.rootToTipLengths());
    tree.nodeList.forEach((node) => node._height =  maxRTT - tree.rootToTipLength(node));
    tree.heightsKnown = true;
    tree.lengthsKnown=false;
    // this.treeUpdateCallback();
}

/**
 * A private recursive function that calculates the length of the branch below each node
 */
function calculateLengths(tree){
    tree.nodeList.forEach((node)=> node._length =node.parent? node.parent.height- node.height:0);
    tree.lengthsKnown=true;
    tree.heightsKnown=false;
    // this.treeUpdateCallback();

}




/**
 * A private recursive function that uses the Fitch algorithm to assign
 * states to nodes using parsimony. An acctrans or deltrans algorithm can
 * then be used to reconstruct internal node states.
 * @param name
 * @param node
 * @returns {*}
 */
function fitchParsimony(name, node) {

    if (!node.children) {
        if (!node.annotations[name]) {
            return []; // annotation not defined so return an empty set
        }
        return (Array.isArray(node.annotations[name]) ? node.annotations[name] : [node.annotations[name]]);
    }

    let I;
    let U = [];
    node.children.forEach( (child) => {
        const childStates = fitchParsimony(name, child);
        U = [...U, ...childStates.filter( (state) => !U.includes(state) )]; // take the union
        I = (I === undefined ? childStates : childStates.filter( (state) => I.includes(state) )); // take the intersection
    });

    // node.annotations = (node.annotations === undefined ? {} : node.annotations);

    // set the node annotation to the intersection if not empty, the union otherwise
    this.annotateNode(node, {[name]:[...(I.length > 0 ? I : U)]});

    return node.annotations[name];
}

function reconstructInternalStates(name, parentStates, acctran, node ) {
    let nodeStates = node.annotations[name];
    if (!Array.isArray(nodeStates)) {
        nodeStates = [nodeStates];
    }

    if (node.children) {

        let stateCounts = {};

        nodeStates
            .forEach((state) => stateCounts[state] = (stateCounts[state] ? stateCounts[state] += 1 : 1) );

        parentStates
            .forEach((state) => stateCounts[state] = (stateCounts[state] ? stateCounts[state] += 1 : 1) );

        node.children.forEach((child) => {
            reconstructInternalStates(name, nodeStates, acctran, child)
                .forEach((state) => stateCounts[state] = (stateCounts[state] ? stateCounts[state] += 1 : 1) );
        });

        const max = Object.entries(stateCounts).reduce((prev, current) => (prev[1] > current[1]) ? prev : current)[1];
        nodeStates = Object.entries(stateCounts).filter(([state, count]) => count === max).map(([state, count]) => state );

        node.annotations[name] = (nodeStates.length === 1 ? nodeStates[0] : nodeStates);
    }

    return nodeStates;
}
function makeNode(nodeData,external=false){
    const node = new Node({...nodeData, tree:this});
    this._nodeMap.set(node.id, node);
    if(external){
        if(this._tipMap.has(node.name)){
            throw new Error("${node.name} already in tree");
        }
        this._tipMap.set(node.name, node);
    }
}

/**
 * The node class. This wraps a node in a tree and notifies the tree when
 * the node updates. It can be treated almost exactly like an object. It just has
 * helper setters and getters to handel changes, and a few extra methods.
 * {
            height:undefined,
            divergence:undefined,
            length:undefined,
            name:null,
            annotations:{},
            parent:undefined,
            children:null,
            label:undefined,
            id:`node-${v4()}`
        }
 */

class Node{

    static DEFAULT_NODE(){
        return{
            height:undefined,
            divergence:undefined,
            length:undefined,
            name:null,
            annotations:{},
            parent:undefined,
            children:null,
            label:undefined,

        }

    }


    constructor(nodeData ={}){
        const data = {...Node.DEFAULT_NODE(),...nodeData};
        this._id = ` node-${v4()}`
        this._height = data.height;
        this._length = data.length;
        this._name = data.name;
        this._annotations= data.annotations;
        this._parent = data.parent;
        this._children = data.children;
        this._tree = data.tree;
        this._label = data.label;
    }
    get level() {
        let level=0;
        let node=this;
        while(node.parent){
            node=node.parent;
            level+=1
        }
        return level;
    }
    get name() {
        return this._name;
    }
    set name(value){
        if(this._tree._labelMap.has(label)){
            throw new Error(`Node Names are used to key nodes and must be unique. Name ${value} already exists in the tree`)
        }
        if(this._children){
            throw new Error(`Node Names are only allowed for external nodes.Name ${value} was added to a node with children`)
        }
        this._tree.nodesUpdated=true;
        this._name = value;
    }

    get label() {
        return this._label;
    }

    set label(value) {
        if(this._tree._labelMap.has(value)){
            throw new Error(`Node labels are used to key nodes and must be unique. Label ${value} already exists in the tree`)
        }
        if(this._children===null){
            throw new Error(`Node Labels are only allowed for internals  nodes. label ${value} was added to a node without children`)

        }
        this._tree._labelMap.set(value,this);
        this._label = value;
        this._tree.nodesUpdated=true;

        
    }
    get height() {
        if(!this._tree.heightsKnown){
            calculateHeights(this._tree);
        }
        return this._height;
    }

    get divergence(){
        if(this._tree.lengthsKnown){
            if(this.parent){
                return this.parent.divergence+this.length
            }else{
                return 0
            }
        }else{
            calculateLengths(this._tree);
            return this.divergence;
        }
    }

    set height(value) {
        if(!this._tree.lengthsKnown){
            calculateHeights.call(this._tree);
        }
        this._height = value;
        this._tree.lengthsKnown=false;
        // this._tree.treeUpdateCallback();
    }

    get length() {
        if(!this._tree.lengthsKnown){
            calculateLengths.call(this._tree);
        }
        return this._length;
    }

    set length(value) {
        if(!this._tree.lengthsKnown){
            calculateLengths.call(this._tree);
        }
        this._tree.heightsKnown=false;
        this._length = value;
        // this._tree.treeUpdateCallback();
    }

    get annotations() {
        return {...this._annotations};
    }

    set annotations(value){
        throw new Error("node annotations can not be set this way. The tree needs to know about annotation types. Use tree.annotateNode to set annotations")
    }
    /**
     * Return an array over the children nodes
     * @return {*}
     */
    get children() {
        if(this._children===null){
            return null
        }
        return this._children.map(childId=>this._tree.getNode(childId));
    }
    removeChild(node){
        this._children= this._children.filter(childId => childId !== node.id);
        node._parent=null;
    }

    addChild(node) {
        if(this._children===null){
            this._children=[];
        }
        this._children.push(node.id);
        node._parent = this._id;
    }


    // set children(value) {
    //     this._children = value;
    //     for(const child of this._children){
    //         child.parent=this;
    //     }
    //     this._tree.nodesUpdated = true;
    // }
    get parent() {
        return this._tree.getNode(this._parent);
    }
    // set parent(node) {
    //     this._parent = node;
    //     if(this._parent.children.filter(c=>c===this).length===0){
    //         this._parent.children.push(this)
    //     }
    //     this._tree.nodesUpdated = true;
    // }
    get id(){
        return this._id;
    }
    get tree(){
        return this._tree;
    }
    //TODO use bitmap not int
    getClade(tipNameMap=null){
        if(tipNameMap==null && this.clade && this._tree.nodesUpdated===false){
            return(this._clade)
        }

        let bits = [];
        if(!this.children){
            const nodeNumericId = tipNameMap? tipNameMap.get(this.name):this.id;
            if(nodeNumericId!==parseInt(nodeNumericId)){
                throw new Error("Getting clade requires tips have integer id's. If they do not please provide a map to integers keyed by the tips' names ")
            }
            bits = bits.concat(this.id);
            this._clade = bits;
        }else{
            for(const child of this.children){
                bits = bits.concat(child.getClade(tipNameMap));
            }
           this._clade=bits;
        }
        return bits;
    };


    toJS(){
        return ({
                // id: this.id,
                name:this.name,
                length:this.length,
                height:this.height,
                label:this.label,
                level:this.level,
                annotations:this.annotations,
                children: this.children && this.children.length>0? this.children.map(child=>child.toJS()):null,
                });
}


}

