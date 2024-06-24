import {Tree} from '../../../../src'
import {rectangularLayout} from '../../../../src'
import {preOrderPrecursor} from '../../../../src/figure/layout/rectangularLayout.f'

describe("Test preorderPrecursor",()=>{
    it('fist node',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const firstPre = preOrderPrecursor(tree.getExternalNode('a'))
        expect(firstPre).toBeNull();
    })
    it('sibling',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const pre = preOrderPrecursor(tree.getExternalNode('b'))
        expect(pre).toBe(tree.getExternalNode('a'));
    })
    it('cousin',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,(c:1.d:1):1);");
        const pre = preOrderPrecursor(tree.getExternalNode('c'))
        // expect(pre).toBe(tree.root.children[0]);
    })
})


describe("Test rectangular layout",()=>{
    it('check x and y on root', function() {
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const root = rectangularLayout(tree.root);

        expect(root.x).toBeCloseTo(0);
        expect(root.y).toBeCloseTo(1.25); 

        // //a
        const a = tree.getExternalNode("a");
        const aV = rectangularLayout(a);
        expect(aV.x).toBeCloseTo(2);
        expect(aV.y).toBeCloseTo(0); 

        // //c
        const c = tree.getExternalNode("c");
        const cV = rectangularLayout(c);
        expect(cV.x).toBeCloseTo(1);
        expect(cV.y).toBeCloseTo(2); 
    });
    it('check after reordering', function() {
    // check above but with rotations
        
    const tree = Tree.parseNewick("((a:1,b:1):1,c:1);")
    const ogC = rectangularLayout(tree.getExternalNode("c"));

    tree.orderByNodeDensity(true)
    const reordededC = rectangularLayout(tree.getExternalNode("c"));

        expect(ogC).not.toBe(reordededC)

       
    });
    


})