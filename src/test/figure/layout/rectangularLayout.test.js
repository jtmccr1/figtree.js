import {Tree} from '../../../../src'
import {rectangularLayout,transmissionLayout} from '../../../../src'
import { preOrderPrecursor} from '../../../../src/figure/layout/rectangularLayout.f'


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
    it('through root',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const pre = preOrderPrecursor(tree.getExternalNode('c'))
        expect(pre).toBe(tree.getExternalNode('b').parent);
    })
    it('through other node to root',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,(c:1,d:1));");
        
        const pre = preOrderPrecursor(tree.getExternalNode('c'))
        expect(pre).toBe(tree.getExternalNode('b').parent);
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

    it('Issue with traversal', function (){
        // This tree is used in the index html and it the last tips Virus 10 and Virus 9 are layed out but do not affect 
        // node positions nor do they ever change position
        const tree =  Tree.parseNewick("((((((virus1:0.1,virus2:0.12)0.95:0.08,(virus3:0.011,virus4:0.0087)1.0:0.15)0.65:0.03,virus5:0.21)1.0:0.2,(virus6:0.45,virus7:0.4)0.51:0.02)1.0:0.1,virus8:0.4)1.0:0.1,(virus9:0.04,virus10:0.03)1.0:0.6);");
        const v10= rectangularLayout(tree.getExternalNode("virus10"))
        const v2= rectangularLayout(tree.getExternalNode("virus2"))

        expect(v10.y).toBeCloseTo(9)
        expect(v2.y).toBeCloseTo(1)


    })
    
    it("traversal after reroot", function () {
        const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;
    
        const tree = Tree.parseNewick(newickString);
        tree.reroot(tree.getExternalNode("virus1"), 0.5);
        const pre = preOrderPrecursor(tree.getExternalNode("virus1"))
        expect(pre).toBeNull()
      });

})

describe("Test transmission Layout", ()=>{
    it('check x and y on root', function() {
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const root = transmissionLayout(tree.root);

        expect(root.x).toBeCloseTo(0);
        expect(root.y).toBeCloseTo(0); 

        // //a
        const a = tree.getExternalNode("a");
        const aV = transmissionLayout(a);
        expect(aV.x).toBeCloseTo(2);
        expect(aV.y).toBeCloseTo(0); 

        // //c
        const c = tree.getExternalNode("c");
        const cV = transmissionLayout(c);
        expect(cV.x).toBeCloseTo(1);
        expect(cV.y).toBeCloseTo(2); 
    });

})