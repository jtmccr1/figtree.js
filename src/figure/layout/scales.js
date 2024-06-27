import { polarScaleMaker } from "./polarLayout.f";
import { scaleLinear } from "d3-scale";
export function getScale({
    maxX,
    maxY,
    canvasWidth,
    canvasHeight,
    layoutType,
    invert = false,
    minRadius = 0,
    angleRange = 2 * Math.PI,
    rootAngle = 0,
  }) {

    switch (layoutType) {
      case "EUCLIDEAN":
        const xScale  = scaleLinear().domain([0,maxX]).range([0,canvasWidth]);
        const yScale = scaleLinear().domain([0,maxY]).range([0,canvasHeight]);
          return ({x,y})=> ({ x:xScale(x),y: yScale(y) });
      case "POLAR":
        return polarScaleMaker({
          maxX,
          maxY,
          canvasWidth,
          canvasHeight,
          invert,
          minRadius,
          angleRange,
          rootAngle}
        );
  
      default:
        throw new Error(`layout type not implemented : ${layoutType} `);
    }
  }
  