import { normalizeAngle } from "./polarLayout.f";
import { min } from "d3-array";

function consistentSorting(incomingNode){
  return function (node1,node2){
  
  if(node1.isRoot()){
    const throughChild  = node1.children.find(n=>n!==incomingNode);
    return throughChild.id>node2.id?-1:1

  }else if (node2.isRoot()){
    const throughChild  = node2.children.find(n=>n!==incomingNode);
    return node1.id>throughChild.id?-1:1
  }else{
    return node1.id>node2.id?-1:1
  }
}
}

export function radialLayout(startNode, fixed = true, spread = 1) {
  // for constant ordering

  // if fixed keep track of the order and use it next time.
  let nodeOrder;

  // we pass through the root so if one of the nodes is the root then we judge it based on it's 
  // 'children'
  const sorter = fixed? consistentSorting  :(node)=>(a,b)=>1
  return function layout(tree) {
    //todo set some map for fixing the traversal of the tree.
    const vertexMap = new Map();
    if (startNode == null) {
      startNode = tree.root;
    }

  

    const traversal = function (
      node,
      currentNode = null,
      opts = {
        angleStart: 0,
        angleEnd: 2 * Math.PI,
        xpos: 0,
        ypos: 0,
        length: 0,
      }
    ) {
      let vertex;

      const { angleStart, angleEnd, xpos, ypos, length } = opts;

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

        for (const child of pseudoChildren) {
          const leafCount = [...tree.pseudoRerootPreOrder(child, node)].filter(
            // why is tree a node here?
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

        for (const child of pseudoChildren.sort(sorter(node))) {
          let a1 = a2;
          a2 = a1 + (span * childLeafCount.get(child)) / totalLeafs;
          const length = child === node.parent ? node.length : child.length;
          traversal(child, node, {
            angleStart: a1,
            angleEnd: a2,
            xpos: x,
            ypos: y,
            length,
          });
        }
      }

      vertexMap.set(node, vertex);
    };

    traversal(startNode);
    return vertexMap;
  };
}
