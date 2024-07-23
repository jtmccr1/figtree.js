import { polarLayout } from "../../../figure";
import {Tree } from "../../../../src"

describe("Test rectangular layout",()=>{
    it('check x and y on root', function() {
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        const layout = polarLayout(tree);

        const root= layout.get(tree.root)
        expect(root.x).toBeCloseTo(0);
        expect(root.y).toBeCloseTo(1.25); 

        // //a
        const a = tree.getExternalNode("a");
        const aV = layout.get(a);
        expect(aV.x).toBeCloseTo(2);
        expect(aV.y).toBeCloseTo(0); 

        // //c
        const c = tree.getExternalNode("c");
        const cV = layout.get(c)
        expect(cV.x).toBeCloseTo(1);
        expect(cV.y).toBeCloseTo(2); 
    })
})