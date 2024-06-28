import { polarScaleMaker } from "./polarLayout.f";
import { scaleLinear } from "d3-scale";
export function getScale({
    maxX,
    maxY,
    minX,
    minY,
    canvasWidth,
    canvasHeight,
    layoutType,
    invert = false,
    minRadius = 0,
    angleRange = 1.7 * Math.PI,
    rootAngle = 0,
  }) {

    switch (layoutType) {
      case "EUCLIDEAN":{
        const xScale  = scaleLinear().domain([minX,maxX]).range([0,canvasWidth]);
        const yScale = scaleLinear().domain([minY,maxY]).range([0,canvasHeight]);
          return ({x,y})=> ({ x:xScale(x),y: yScale(y) });
      }
      case "POLAR":
        return polarScaleMaker({
          maxX,
          maxY,
          minX,
          minY,
          canvasWidth,
          canvasHeight,
          invert,
          minRadius,
          angleRange,
          rootAngle}
        );
        case "RADIAL":{
          const xScale  = scaleLinear().domain([minX,maxX]).range([0,canvasWidth]);
          const yScale = scaleLinear().domain([minY,maxY]).range([0,canvasHeight]);
            return ({x,y,theta})=> ({ x:xScale(x),y: yScale(y),theta});
        }

      default:
        throw new Error(`layout type not implemented : ${layoutType} `);
    }
  }
  