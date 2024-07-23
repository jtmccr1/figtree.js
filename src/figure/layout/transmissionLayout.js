


export default function layout(tree){
    let currentY = -1;
    const vertexMap = new Map()
      for(const node of tree.postorder()){
        const x = node.divergence;
        let y;
        if(!node.children){
          y = currentY+=1;
        }
        if(node.children){
          y = vertexMap.get(node.children[0]).y
        }
        vertexMap.set(node,{x,y})
      }
      return vertexMap;
  }
  