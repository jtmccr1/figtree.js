import { radialLayout } from "../../../figure";
import { Tree } from "../../../evo";

describe("Test radial traversal",()=>{
    it('fist node',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const first = tree.pseudoRerootPreOrder(tree.getExternalNode('a')).next()
        expect(first.value).toBe(tree.getExternalNode('a'));
    })
    it('second node',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const traversal = tree.pseudoRerootPreOrder(tree.getExternalNode('a'))
        traversal.next()
        const second = traversal.next()
        expect(second.value).toBe(tree.getExternalNode('a').parent);
    })
    it('third',()=>{
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const nodes = [...tree.pseudoRerootPreOrder(tree.getExternalNode('a'))]
        expect(nodes[2]).toBe(tree.root);
    }
    )
})

describe("test layout",()=>{
    it('check x and y on root', function() {
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const layout = radialLayout()(tree);

        const root= layout.get(tree.root)
        expect(root.x).toBeCloseTo(0);
        expect(root.y).toBeCloseTo(0); 

        // //a
        const a = tree.getExternalNode("a");
        const aV = layout.get(a);
        expect(aV.x).toBeCloseTo(0.0063274);
        expect(aV.y).toBeCloseTo(1.7302070); 

        // //c
        const c = tree.getExternalNode("c");
        const cV = layout.get(c)
        expect(cV.x).toBeCloseTo(0.50316);
        expect(cV.y).toBeCloseTo(-0.86419); 
    });
    it('test consistent ordering',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const layoutF = radialLayout(tree.getExternalNode('c'),true)
        const layout1 = layoutF(tree);

        const startingA = layout1.get(tree.getExternalNode('a'))
        
        tree.rotate(tree.getExternalNode('a').parent)

        const layout2 = layoutF(tree)
        
        const endingA = layout2.get(tree.getExternalNode('a'))

        expect(startingA).toEqual(endingA)
    })
    it('test nonconsistent ordering',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const layoutF = radialLayout(tree.getExternalNode('c'),false)
        const layout1 = layoutF(tree);

        const startingA = layout1.get(tree.getExternalNode('a'))
        
        tree.rotate(tree.getExternalNode('a').parent)

        const layout2 = layoutF(tree)
        
        const endingA = layout2.get(tree.getExternalNode('a'))

        expect(startingA).not.toEqual(endingA)
    })
})