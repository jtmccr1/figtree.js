import { mean, min, max } from "d3-array";

export const baseLayout = (type)=>
  (yPos) =>
  (spacingFunction = (previousTip, currentTip) => 1) =>
  (node, providedCache = {}) => {
    const cache = providedCache ? providedCache : {};
    cache.type = type;
    
    const layout = function (node) {
      if (cache[node.id] !== undefined) {
        return cache[node.id];
      }
      let protoVertex;
      const x = node.divergence;
      if (node.children) {
        const kidVertices = node.children.map((child) => layout(child));
        // const y = mean(kidVertices, (d) => d.y);
        const y = yPos(kidVertices);
        const maxY = max(kidVertices, (d) => d.maxY);
        const maxX = max(kidVertices, (d) => d.maxX);
        const minY = min(kidVertices, (d) => d.minY);
        protoVertex = { x, y, maxY, maxX, minY };
      } else {
        const precursorTip = precedingTip(node); // this let's us not traverse the whole tree every time if not needed.
        // previous tip

        if (precursorTip) {
          const y = layout(precursorTip).y;

          const space = spacingFunction(precedingTip, node);
          protoVertex = {
            x,
            y: y + space,
            maxY: y + space,
            maxX: x,
            y: y + space,
          };
        } else {
          protoVertex = { x, y: 0, maxY: 0, maxX: x, minY: 0 };
        }
      }

      const leftLabel = !!node.children;
      const labelBelow =
        !!node.children && (!node.parent || node.parent.children[0] !== node);

      const vertex = {
        ...protoVertex,
        textLabel: {
          labelBelow,
          dx: leftLabel ? "-6" : "12",
          dy: leftLabel ? (labelBelow ? "-8" : "8") : "0",
          alignmentBaseline: leftLabel
            ? labelBelow
              ? "bottom"
              : "hanging"
            : "middle",
          textAnchor: leftLabel ? "end" : "start",
        },
      };
      cache[node.id] = vertex;
      return vertex;
    };

    return layout(node);
  };




export const rectangularLayoutFactory = baseLayout("EUCLIDEAN")((childrenVertices) =>
  mean(childrenVertices, (d) => d.y))

export const transmissionLayoutFactory = baseLayout("EUCLIDEAN")(
  (childrenVertices) => childrenVertices[0].y)

export const rectangularLayout = rectangularLayoutFactory((pt, n) => 1);

export const transmissionLayout = transmissionLayoutFactory((pt, n) => 1);



export function preOrderPrecursor(node) {
  if (node.children) {
    return node.children[node.children.length - 1];
  }
  const meIndex = node.parent.children.findIndex((d) => d === node);

  if (meIndex > 0) {
    return node.parent.children[meIndex - 1]; // sibling
  } else {
    // need to go towards root and then down sibling
    let n = node;
    let p = n.parent;
    let nIndex = p.children.findIndex((d) => d === n);

    while (nIndex === 0 && !p.isRoot()) {
      n = p;
      p = n.parent;
      nIndex = p.children.findIndex((d) => d === n);
    }
    if (p.isRoot() && nIndex === 0) {
      //At first child of all first children
      return null;
    }

    return p.children[nIndex - 1];
  }
}
export function precedingTip(node) {
  const previousNode = preOrderPrecursor(node);
  if (previousNode === null) return null; // at first tip in traversal

  let prevTip = previousNode;
  while (prevTip.children) {
    prevTip = prevTip.children[prevTip.children.length - 1];
  }
  return prevTip;
}
