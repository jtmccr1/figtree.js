import { mean, min, max } from "d3-array";

export function rectangularLayout(node, providedCache = {}) {
  const cache = providedCache ? providedCache : {};
  const layout = function (node) {
    if (cache[node.id]!==undefined) {
      return cache[node.id];
    }

    let protoVertex;
    const x = node.divergence;
    if (node.children) {
      const kidVertices = node.children.map((child) => layout(child));
      const y = mean(kidVertices, (d) => d.y);
      const maxY = max(kidVertices, (d) => d.maxY);
      const maxX = max(kidVertices, (d) => d.maxX);
      const minY = min(kidVertices, (d) => d.minY);
      protoVertex = { x, y, maxY, maxX, minY };
    } else {
      const precursorNode = preOrderPrecursor(node);
      if (precursorNode) {
        const y = layout(precursorNode).maxY;
        protoVertex = {
          x,
          y: y + 1,
          maxY: y + 1,
          maxX: x,
          y: y + 1,
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
    cache[node.id]=vertex;
    return vertex;
  };

  return layout(node)
}

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
    if (p.isRoot()) {
      //At first child of all first children
      return null;
    }
    return p.children[nIndex - 1];
  }
}
