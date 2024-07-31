import { select } from "d3-selection";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";

/** Figtree options
 * parent: the parent that will hold the svg. 1 figtree per svg
 * width: svg width
 * height: svg height
 * layout: layout function (tree) -> Map<node,vertex>
 * margins: {top:,bottom:left:right}
 * transitions:{duration,ease}
 * tree: Tree
 * baubles: Baubles[]
 * features: Features[]
 */

export default function figtree(opts) {
  // check if svgid is there if it is not add it

  const {
    parent,
    width,
    height,
    layout,
    margins,
    transitions,
    tree,
    baubles,
    features,
  } = opts;

  console.log(parent)
  //add svg or update svg as needed
  const svgSelection = select(parent)
    .selectAll(".figtree")
    .data(['figure']) // why do we need data here?
    .join("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class",'figtree')
        .selectAll('g.figtree-base') // class is needed to ensure new group is not added each render
        .data(['g'])
        .join('g')
        .attr("transform", `translate(${margins.left},${margins.top})`)
        .attr("class", 'figtree-base')

  //update layout
  const vertexMap = layout(tree);
  //update scales
  const scales = setUpScales({ width, height, margins, baubles, vertexMap });

  baubles.forEach(b=>b.setFigureTransitions(transitions));

  // handle group here so we can use the ids as data
  svgSelection
  .selectAll('.bauble')
  .data([...baubles].reverse()) // so we don't update the original array
  .join('g')
  .attr('id',d=>d.id)
  .attr('class', d=> `bauble ${d.class}`)
  .each(function(bauble,i){
    bauble.renderAll({parent:this,scales,vertexMap})
  })

  // todo return svg if not already there. else update.
}

function setUpScales({ baubles, width, height, margins, vertexMap }) {

  let xExtent=[];
  let yExtent=[];
  let rExtent=[];
  for (const bauble of baubles) {
    const vertices = bauble.data.map((n) => vertexMap.get(n));
    xExtent = extent(xExtent.concat(vertices.map(v=>v.x)));
    yExtent = extent(yExtent.concat(vertices.map(v=>v.y)));
    rExtent = extent(rExtent.concat(vertices.map(v=>v.r)));
  }

  const canvasWidth = width - margins.left - margins.right;
  const canvasHeight = height - margins.top - margins.bottom;

  return {
    x: scaleLinear().domain(xExtent).range([0, canvasWidth]),
    y: scaleLinear().domain(yExtent).range([0, canvasHeight]),
    r: scaleLinear()
      .domain(rExtent)
      .range([0, Math.min(canvasHeight, canvasWidth) / 2]),
  };
}
