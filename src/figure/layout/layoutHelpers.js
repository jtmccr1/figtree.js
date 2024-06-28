import {Type} from "../../evo/tree.js";
import parse from 'parse-svg-path'
import abs from 'abs-svg-path'
import normalize from 'normalize-svg-path'


export function getClassesFromNode(node){
    let classes = [(!node.children ? "external-node" : "internal-node")];
    const tree = node.tree;
    if (node.annotations) {
        classes = [
            ...classes,
            ...Object.entries(node.annotations)
                .filter(([key]) => {
                    return tree.annotations[key] &&
                        (tree.annotations[key].type === Type.DISCRETE ||
                            tree.annotations[key].type === Type.BOOLEAN ||
                            tree.annotations[key].type === Type.INTEGER);
                })
                .map(([key, value]) =>{
                    if(tree.annotations[key].type===Type.DISCRETE || tree.annotations[key].type === Type.INTEGER){
                        return `${key}-${value}`;
                    }else if(tree.annotations[key].type === Type.BOOLEAN && value ){
                        return `${key}`
                    }
                })];
    }
    return classes;
}

class point{
    constructor(x,y){
        this.x=x
        this.y=y
    }
}
const NUMBER_OF_POINTS=4; // this should be more than needed by layouts 
export function normalizePath(path){ //TODO this might remove the fill on cartoons.
    const parsedPath = parse(path)
    const absPath = abs(parsedPath)
    const normalizedPath = normalize(absPath) // normalized path is [M, x,y ] [C, x1,y1, x2,y2, x,y]....

    let newPath = `${normalizedPath[0][0]} ${normalizedPath[0][1]} ${normalizedPath[0][2]} `
    let curves = normalizedPath.filter((d)=>d[0]==="C").map((curve)=>{return [new point(curve[1], curve[2]),new point(curve[3], curve[4]),new point(curve[5], curve[6])]})

    if(curves.length>NUMBER_OF_POINTS){
        throw new Error(`Path must have no more than ${NUMBER_OF_POINTS} nodes (excluding start point) detected ${curves.length} nodes update layout or path.helpers` )
    }
    if(curves.length==0){
        throw new Error('Path must have at least 1 node (excluding start point) update layout or path.helpers' )
    }

    while(curves.length<NUMBER_OF_POINTS){
        const toSplit = curves.pop();
        const {left,right} = splitCubicB(toSplit,0.5);
        curves.push(left);
        curves.push(right.reverse());
    }

    for(let i = 0; i<curves.length; i++){
        const curve = curves[i];
        newPath+=`C${curve[0].x},${curve[0].y} ${curve[1].x},${curve[1].y} ${curve[2].x},${curve[2].y} `
    }
    return newPath;
}

function splitCubicB(curve,t){
    const left=[]
    const right=[]
    
    function getCurve(points,t){
        if(points.length==1){
            left.push(points[0])
            right.push(points[0])
        }else{
            const newPoints = Array(points.length-1)
            for(let i =0; i<newPoints.length; i++){
                if(i==0){
                    left.push(points[0])
                }
                if(i==newPoints.length-1){
                    right.push(points[i+1])
                }
                newPoints[i]=new point((1-t)*points[i].x+t*points[i+1].x,(1-t)*points[i].y+t*points[i+1].y)
            }
            getCurve(newPoints,t)
        }
    }
        getCurve(curve,t);
        return {left,right}
    }