
// TODO fix order of traversal based on downstream tips.

const defaultOps = { startNode: null, backStop: null, filter: () => true, nodeOrdering: consistentOrdering };

function* pseudoRerootPreOrder(tree, opts) {

    const { startNode, filter, nodeOrdering } = { ...defaultOps, ...opts };

    const traverse = function* (node, incomingNode) {
        yield node;

        const relatives = [node.parent && node.parent]
            .concat(node.children && node.children)
            .filter((n) => n); // to remove null // do we need this?

        let pseudoChildren = relatives
            .filter((n) => n !== incomingNode && filter(n))
            .sort(nodeOrdering);

        if (pseudoChildren.length > 0) {
            for (const child of pseudoChildren) {
                yield* traverse(child, node);
            }
        }
    };

    const firstNode = startNode ? startNode : tree.root;
    const incomingNode = backStop ? backStop : null;
    yield* traverse(firstNode, incomingNode);
}


function* pseudoRerootPostOrder(tree, opts) {

    const { startNode, filter, nodeOrdering } = { ...defaultOps, ...opts };

    const traverse = function* (node, incomingNode) {
        const relatives = [node.parent && node.parent]
            .concat(node.children && node.children)
            .filter((n) => n); // to remove null // do we need this?
        let pseudoChildren = relatives
            .filter((n) => n !== incomingNode && filter(n))
            .sort(nodeOrdering);
        if (pseudoChildren.length > 0) {
            for (const child of pseudoChildren) {


                yield* traverse(child, node);
            }
        }
        yield node;
    };

    const firstNode = startNode ? startNode : tree.root;
    yield* traverse(firstNode, incomingNode);
}





/* A private recursive function that rotates nodes to give an ordering provided
* by a function.
* @param node
* @param ordering function that takes (a,number of tips form a, b, number of tips from b) and sorts a and be by the output.
* @param callback an optional callback that is called each rotate
* @returns {number}
*/

/* ordering 
*  (nodeA, countA, nodeB, countB) => {
*      return (countA - countB) * factor;
*   });
*
*/

function consistentOrdering(incomingNode) {
    return function (node1, node2) {

        const traversal1 = pseudoRerootPostOrder(incomingNode.tree,{backStop:incomingNode,})
        const tip1Id = getFirstTip(node1);
        const tip2Id = getFirstTip(node2);
        if (tip1Id > tip2Id) {
            return 1;
        } else {
            return -1;
        }
    }
}

function getFirstTip(traversal) {
    // count the number of descendents for each child
    const tips = []
    for (const child of traversal) {
        if (!child.children) {
            tips.push(child.id)
        }
    }
    tips.sort();
    return tips[0];
} 
