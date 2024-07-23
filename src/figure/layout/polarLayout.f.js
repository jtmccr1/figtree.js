import { baseLayout } from "./rectangularLayout.f";
import {mean,extent} from 'd3-array'
import {scaleLinear} from 'd3-scale'
// the magic happens in the scale 



// polar layout will put the x y on a 100 by 100 square and that will be scaled by the figure to match

// radius will need to be scaled as well.
export default function layout(tree){
    const step = 1.99 *Math.PI / tree.externalNodes.length
    const vertexMap = new Map();
    for(const node of tree.postorder()){
        const r = node.divergence;
        let theta;
        let currentTheta = 0;
        if(!node.children){
            theta = currentTheta+=step;
            // console.log(currentTheta)
            // console.log(step)

          }
          if(node.children){
            theta = mean(node.children.map(c=>vertexMap.get(c).theta))
          }
          vertexMap.set(node,{r,theta,...polarToCartesian(r,theta)})// might not need polar to cartcartesain here 
    }

    // console.log(vertexMap)
    return vertexMap;

}


export function polarScaleMaker({ maxX, maxY, canvasWidth, canvasHeight, invert = false, minRadius = 0, angleRange = 1.7 * Math.PI, rootAngle = 0 }) {
  
    const maxRadius = Math.min(canvasWidth, canvasHeight) / 2;

    // These scales adjust the x and y values from arbitrary layout to polar coordinates with r within the svg and theta between 0 and 2pi

    const safeAngleRange = normalizeAngle(angleRange);
    const rRange = invert ? [minRadius * maxRadius, maxRadius].reverse() : [minRadius * maxRadius, maxRadius];
    const rScale = scaleLinear()
        .domain([0, maxX])
        .range(rRange);


    const startAngle = rootAngle + (2 * Math.PI - safeAngleRange) / 2; //2pi - angle range  is what we ignore and we want to center this on the root angle
    const endAngle = startAngle + safeAngleRange;
    
    const thetaScale = scaleLinear()
        .domain([0, maxY])
        .range([startAngle, endAngle]); // rotated to match figtree orientation

    // (x,y) =>polarToCartesian(rScale(x),thetaScale(y))=>(x,y)
    
    // Once we have the polar coordinates we will convert back to cartesian coordinates
    // But we need to adjust the aspect ratio to fit the circle

    // center (0,0) polartoCartesian(maxRadius,startAngle) is top left of svg
    const extremes = [[0, 0], polarToCartesian(maxRadius, startAngle), polarToCartesian(maxRadius, endAngle)]; 

    // Also need every pi/2 point we pass through.
    //assumes range is <=2pi
    const normlizedStart = normalizeAngle(startAngle);
    const normlizedEnd = normalizeAngle(normlizedStart + safeAngleRange); 

    if (normlizedEnd > normlizedStart) {
        for (const theta of [Math.PI / 2, Math.PI, 3 * Math.PI / 2].filter(d => d > normlizedStart && d < normlizedEnd)) {
            const [x, y] = polarToCartesian(maxRadius, theta);
            extremes.push([x, y]);
        }
    } else { //we've crossed 0

        for (const theta of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].filter(d => d > normlizedStart || d < normlizedEnd)) {
            const [x, y] = polarToCartesian(maxRadius, theta);
            extremes.push([x, y]);
        }

    }

    const xDomain = extent(extremes, (d) => d[0]);
    const yDomain = extent(extremes, (d) => d[1]);

    const ratio = (xDomain[1] - xDomain[0]) / (yDomain[1] - yDomain[0]);

    const scaler = Math.min(canvasWidth, canvasHeight * ratio)
    const width = scaler;
    const height = scaler / ratio;

    const xShift = (canvasWidth - width) / 2;
    const yShift = (canvasHeight - height) / 2;

    const yRange = [yShift, canvasHeight - yShift];
    const xRange = [xShift, canvasWidth - xShift];
    
    const xScale = scaleLinear().domain(xDomain).range(xRange);
    const yScale = scaleLinear().domain(yDomain).range(yRange);

   
    return function({x,y}){
        const [r,theta] =[rScale(x),normalizeAngle(thetaScale(y))];
        const [xcart,ycart] = polarToCartesian(r,theta);
        return {x:xScale(xcart),y:yScale(ycart),r,theta}
    }
}


export function polarToCartesian(r, theta){
    return {x:r*Math.cos(theta),y:r*Math.sin(theta)};
}

export function normalizeAngle(theta){
    while(theta>2*Math.PI ){
    theta-=2*Math.PI
    }
    return theta;
}

export function degrees(theta){
    return normalizeAngle(theta)*180/Math.PI;
}

//this function converts radians to degrees and adjusts degrees 
// so the text is not fliped
export function textSafeDegrees(radians){
    const d =  degrees(radians)

    if(d>90 && d<270){
        return d-180;
    }else{
        return d
    }
}



export const polarLayoutFactory = baseLayout("POLAR")((childrenVertices) =>
    mean(childrenVertices, (d) => d.y))
    
  export const polarLayout =polarLayoutFactory((pt, n) => 1);