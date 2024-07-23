import {Tree} from '../../../../src'
import {transmissionLayout} from '../../../../src'



describe("Test transmission Layout", ()=>{
    it('check x and y on root', function() {
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const layout = transmissionLayout(tree);
        const root = layout.get(tree.root);

        expect(root.x).toBeCloseTo(0);
        expect(root.y).toBeCloseTo(0); 

        // //a
        const a = layout.get(tree.getExternalNode("a"));
        expect(a.x).toBeCloseTo(2);
        expect(a.y).toBeCloseTo(0); 

        // //c
        
        const c = layout.get(tree.getExternalNode("c"));
        expect(c.x).toBeCloseTo(1);
        expect(c.y).toBeCloseTo(2); 
    });

})