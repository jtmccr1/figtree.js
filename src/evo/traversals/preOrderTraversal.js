/**
 * A generator function that returns the nodes in a pre-order traversal.
 *
 * @returns {IterableIterator<IterableIterator<*|*>>}
 */
const defaultOps = { startNode: null, filter: () => true };

export default function* preorder(tree, opts) {
    const { startNode, filter } = { ...defaultOps, ...opts };
    const traverse = function* (node, filter) {
        if (filter(node)) {
            yield node;
            if (node.children != null) {
                for (const child of node.children) {
                    yield* traverse(child, filter);
                }
            }
        }
    };
    const firstNode = startNode ? startNode : tree.root;
    yield* traverse(firstNode, filter);
}