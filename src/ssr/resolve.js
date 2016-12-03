const DETACHED_NODE = 0;
const ATTACHED_NODE = 1;

let currentNodePath;
let currentPath;
let treeRoot;
let activeHydrate;

export function setPaths(paths, root) {
    currentNodePath = 0;
    currentPath = paths;
    treeRoot = root;
    activeHydrate = true;
}

export function clearPaths() {
    activeHydrate = false;
}

export function getNode(templateEl, root) {
    if (!activeHydrate) return templateEl;

    let node;

    if (currentNodePath === 0) {
        node = treeRoot;
    } else {
        node = root;
        let path = currentPath[currentNodePath];
        let isDetached = path.pop() === DETACHED_NODE;

        for (let i = path.length - 1; i >= 0; i--) {
            node = node.childNodes[path[i]];
        }

        if (isDetached) {
            node.parentNode.replaceChild(templateEl, node);
            node = templateEl;
        }
    }

    currentNodePath++;

    return node;
}

function getPath(el, rootEl, indexMap) {
    let path = [];
    let curNode = el;

    while (curNode && curNode !== rootEl) {
        let index = indexMap.get(curNode);
        if (index == null) {
            index = Array.prototype.indexOf.call(curNode.parentNode.childNodes, curNode);
            indexMap.set(curNode, index);
        }

        path.push(index);
        curNode = curNode.parentNode;
    }

    return path;
}

export function getPaths(component, paths, indexMap, parent) {
    let toVisit = [];
    let nodes = component._nodes;
    let {el: root} = nodes[nodes.length - 1];

    let path = getPath(root, parent ? parent.getRootEl() : root, indexMap);
    path.push(ATTACHED_NODE);

    paths.push(path);

    for (let i = 0; i < nodes.length - 1; i++) {
        let node = nodes[i];
        let {el, placeHolder, children, child} = node;

        let path = getPath(placeHolder || el, root, indexMap);
        path.push(placeHolder ? DETACHED_NODE : ATTACHED_NODE);
        paths.push(path);

        if (children) {
            toVisit.push(...children);
        } else if (child) {
            toVisit.push(child);
        }
    }

    for (let child of toVisit) {
        getPaths(child, paths, indexMap, component);
    }
}
