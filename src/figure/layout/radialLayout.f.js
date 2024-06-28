import { normalizeAngle } from "./polarLayout.f";
import {min} from 'd3-array'
export function* pseudoRerootPostOrder(node, currentNode = null) {
  const traverse = function* (node, currentNode) {
    yield node;
    const relatives = [node.parent && node.parent]
      .concat(node.children && node.children)
      .filter((n) => n); // to remove null
    let pseudoChildren = relatives.filter((n) => n !== currentNode);
    if (pseudoChildren.length > 0) {
      for (const child of pseudoChildren) {
        yield* traverse(child, node);
      }
    }
  };
  yield* traverse(node, currentNode);
}

export function radialLayout(startNode,fixed=true,spread=1) {
  // for constant ordering
  const tipRank = [...pseudoRerootPostOrder(startNode)].filter(
    (n) => !n.children
  );

  // if we have the node then return it
  // relayout whole tree
  return function (node, providedCache) {
    const cache = providedCache ? providedCache : {};
    cache.type = "RADIAL";
    if (cache[node.id] !== undefined) {
      return cache[node.id];
    }

    const layout = function (
      node,
      currentNode = null,
      { angleStart = 0, angleEnd = 2* Math.PI , xpos = 0, ypos = 0,length=0 }
    ) {
      let vertex;
      const branchAngle = normalizeAngle((angleStart + angleEnd) / 2);

      const directionX = Math.cos(branchAngle);
      const directionY = Math.sin(branchAngle);      
      
      const x = xpos + length * directionX;
      const y = ypos + length * directionY;

      vertex = { x, y };
      let theta = branchAngle;
      if (node === startNode) {
        //we are leaving this node but the label will be as if we are coming into it
        theta = normalizeAngle(branchAngle + Math.PI);
      }
      vertex.theta = theta;
      if (node.children || node == startNode) {
        const childLeafCount = new Map();
        let totalLeafs = 0;
        let pseudoChildren = [node.parent && node.parent]
          .concat(node.children && node.children)
          .filter((n) => n && n !== currentNode);

          if(fixed){
            pseudoChildren =pseudoChildren.sort((a, b) => {
              const aRank = min(
                [...pseudoRerootPostOrder(a, node)]
                  .filter((n) => !n.children)
                  .map((n) => tipRank.indexOf(n))
              );
              const bRank = min(
                [...pseudoRerootPostOrder(b, node)]
                  .filter((n) => !n.children)
                  .map((n) => tipRank.indexOf(n))
              );
              return bRank - aRank;
            });
          }


        for (const child of pseudoChildren) {
          const leafCount = [...pseudoRerootPostOrder(child, node)].filter(
            (n) => !n.children
          ).length;
          childLeafCount.set(child, leafCount);
          totalLeafs += leafCount;
        }

        let span = angleEnd - angleStart;
        let updatedAngleStart = angleStart;
        let updatedAngleEnd = angleEnd;
          span *= 1.0 + (spread * Math.PI) / 180 / 10.0;
          updatedAngleStart = branchAngle - span / 2.0;
          updatedAngleEnd = branchAngle + span / 2.0;

        let a2 = updatedAngleStart;

        for (const child of pseudoChildren) {
          let a1 = a2;
          a2 = a1 + (span * childLeafCount.get(child)) / totalLeafs;
          const length = child===node.parent?node.length:child.length
          layout(child, node, {
            angleStart: a1,
            angleEnd: a2,
            xpos: x,
            ypos: y,
            length
          });
        }
      }

      cache[node.id] = vertex;
    };

    layout(startNode, null, {}); //todo swap order here so we don't need to include null in the middle.
    return cache[node.id];
  };
}
