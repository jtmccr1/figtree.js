import { radialLayout } from "../../../figure";
import { Tree } from "../../../evo";
import { pseudoRerootPostOrder } from "../../../figure/layout/radialLayout.f";

describe("Test radial traversal",()=>{
    it('fist node',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const first = pseudoRerootPostOrder(tree.getExternalNode('a')).next()
        expect(first.value).toBe(tree.getExternalNode('a'));
    })
    it('second node',function(){
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const traversal = pseudoRerootPostOrder(tree.getExternalNode('a'))
        traversal.next()
        const second = traversal.next()
        expect(second.value).toBe(tree.getExternalNode('a').parent);
    })
    it('third',()=>{
        const tree = Tree.parseNewick("((a:1,b:1):1,c:1);");
        
        const traversal = pseudoRerootPostOrder(tree.getExternalNode('a'))
        traversal.next()
        traversal.next()
        const n = traversal.next()
        expect(n.value).toBe(tree.root);
    }
    )

})

describe("test layout",()=>{
    
})