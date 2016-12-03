let rTag = /^<\s*([A-Za-z0-9]+).*?>/;

//Taken from https://github.com/jquery/jquery/blob/master/src/manipulation/wrapMap.js
//needed because not all elements can be appended to div tags using innerHTML
let wrapMap = {
    col: ["<table><colgroup>", "</colgroup></table>" ],
    option: ["<select multiple='multiple'>", "</select>" ],
    thead: ["<table>", "</table>" ],
    td: ["<table>", "</table>" ],
    tr: ["<table>", "</table>" ]
};

let document = typeof window !== 'undefined' && window.document;
export let hasServerDoc = false;

export function setDocument(doc) {
    document = doc;
    if (typeof window === 'undefined' || window.document !== document) {
        hasServerDoc = true;
    }
}

export let elMethods = {
    checked(el, val) {
        val = !!val;
        if (el.checked !== val) {
            el.checked = val;
        }
    },
    classNames(el, classNames) {
        for (let className of Object.keys(classNames)) {
            let toggle = classNames[className];
            if (toggle) {
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        }
    },
    disabled(el, val) {
        el.disabled = val;
    },
    hidden(el, val) {
        val = !!val;

        if (val !== el.hidden) {
            el.hidden = val;
        }
    },
    html(el, val) {
        val = val == null ? '' : val;
        if (val !== el.innerHTML) {
            el.innerHTML = val;
        }
    },
    selected(el, val) {
        val = !!val;
        if (el.selected !== val) {
            el.selected = val;
        }
    },
    src(el, val) {
        val = val == null ? '' : val;

        if (val !== el.src) {
            el.src = val;
        }
    },
    styles(el, styles) {
        for (let rule of Object.keys(styles)) {
            el.style[rule] = styles[rule];
        }
    },
    text(el, val) {
        val = val == null ? '' : val;

        if (val !== el.textContent) {
            el.textContent = val;
        }
    },
    value(el, val) {
        val = val == null ? '' : val;
        if (val !== el.value) {
            el.value = val;
        }
    }
};

export let defaultElMethods = {
    defaultChecked: elMethods.checked,
    defaultValue: elMethods.value
};

//A small wrapper around the DOM-related methods used internally.
export default {
    addEvent(elem, event, fn) {
        elem.addEventListener(event, fn, false);
    },

    append(node, parent) {
        parent.appendChild(node);
    },

    childNodes(node) {
        return node.childNodes;
    },

    clone(node) {
        return node.cloneNode(true);
    },

    create(html) {
        let elem;

        let tag = rTag.exec(html);
        let wrapTag = tag ? wrapMap[tag[1]] : null;
        let div = document.createElement('div');

        if (wrapTag) {
            div.innerHTML = wrapTag[0] + html + wrapTag[1];
            elem = div.querySelector(tag[1]);
        } else {
            div.innerHTML = html;
            elem = div.firstChild;
        }

        elem = elem.cloneNode(true);
        div.textContent = '';

        return elem;
    },

    createComment(text = '') {
        return document.createComment(text);
    },

    createTextNode(text = '') {
        return document.createTextNode(text);
    },

    depth(node, root) {
        let depth = 0;
        let curNode = node;

        while (curNode && curNode.parentNode !== root) {
            depth++;
            curNode = curNode.parentNode;
        }

        return depth;
    },

    getAllElements(elem) {
        return elem.getElementsByTagName('*');
    },

    getAttr(elem, attr) {
        return elem.getAttribute(attr);
    },

    isElement(node) {
        return node.nodeType === 1;
    },

    isComment(node) {
        return node.nodeType === 8;
    },

    insertAfter(node, referenceNode) {
        let parent = referenceNode.parentNode;
        let next = referenceNode.nextSibling;

        next ? parent.insertBefore(node, next) : parent.appendChild(node);
    },

    indexOfNode(node) {
        return Array.prototype.indexOf.call(node.parentNode.childNodes, node);
    },

    isText(node) {
        return node.nodeType === 3;
    },

    nodeValue(node, value) {
        if (arguments.length >= 2) {
            return node.nodeValue = value;
        }

        return node.nodeValue;
    },

    parent(node) {
        return node.parentNode;
    },

    remove(node) {
        if (node.parentNode != null) {
            node.parentNode.removeChild(node);
        }
    },

    removeAttr(elem, attr) {
        elem.removeAttribute(attr);
    },

    replace(newNode, oldNode) {
        if (oldNode === newNode || !oldNode.parentNode) return;

        oldNode.parentNode.replaceChild(newNode, oldNode);
    },

    setAttr(elem, attr, value) {
        if (value === true) {
            value = '';
        }

        if (value === false) {
            elem.removeAttribute(attr);
        } else if (elem.getAttribute(attr) !== value) {
            elem.setAttribute(attr, value);
        }
    },

    tag(elem) {
        return elem.tagName.toUpperCase();
    }
};
