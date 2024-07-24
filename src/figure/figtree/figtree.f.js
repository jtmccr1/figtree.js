export default function figtree(opts) {
  // check if svgid is there if it is not add it

  select(`#${this.svgId}`).attr(
    "transform",
    `translate(${margins.left},${margins.top})`
  );

  //update layout
  const vertexMap = layout(tree);
  const scales = setUpScales();
  //update scales if needed
  for (const bauble of baubles.reverse()) {
    //TODO pass layout not cache
    bauble.renderAll(scales, vertexMap);
  }
  // todo remove old baubles
  // check bauble groups in figure and remove if not seen above

  for (const feature of features) {
    feature.render();
  }

  // todo return svg if not already there. else update.
}

function setUpScales() {

  const  width = this[p.svg].getBoundingClientRect().width;
  
    const height = this[p.svg].getBoundingClientRect().height;
  

  const vertices = this[p.tree].nodes.map((n) => this._vertexMap.get(n));
  const xExtent = extent(vertices, (v) => v.x);
  const yExtent = extent(vertices, (v) => v.y);
  const rExtent = extent(vertices, (v) => v.r);

  const canvasWidth = width - this._margins.left - this._margins.right;
  const canvasHeight = height - this._margins.top - this._margins.bottom;

  return {
    x: scaleLinear().domain(xExtent).range([0, canvasWidth]),
    y: scaleLinear().domain(yExtent).range([0, canvasHeight]),
    r: scaleLinear()
      .domain(rExtent)
      .range([0, Math.min(canvasHeight, canvasWidth) / 2]),
  };
}
