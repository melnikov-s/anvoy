export default class Node {
    constructor(el, component, name = '', soleNode = false) {
        this.el = el;
        this.component = component;
        this.name = name;
        this.soleNode = soleNode;
    }

    isRoot() {
        return !this.component || this.component.rootNode === this;
    }

    mount() {}
    preUpdate() {}
    postUpdate() {}
    unmount() {}
    update() {}
}
