import {BaubleManager} from "./baubleManager";

class NodeFactory extends BaubleManager {
    constructor(type) {
        super();
    }
//TODO move onHover to super class and take an _attrs object to update;


}

export const nodes = ()=>{
    return new BaubleManager()
        .class("node")
        .layer("nodes-layer")

};

export const nodeBackground = () =>{
    return new BaubleManager()
        .class("node-background")
        .layer("nodes-background-layer")
};


