const defaultOps = { startNode: null, filter: () => true };

export default function* postOrder(tree, opts) {
    const { startNode, filter } = { ...defaultOps, ...opts };
    const traverse = function* (node, filter) {
        if (filter(node)) {
            if (node.children != null) {
                for (const child of node.children) {
                    yield* traverse(child, filter);
                }
            }
            yield node;
        }
    };
    const firstNode = startNode ? startNode : tree.root;
    yield* traverse(firstNode, filter);
}