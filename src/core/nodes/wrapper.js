import $ from '../../dom';
import {error} from '../../utils';
import {addMount} from '../scheduler';
import Node from './node';

export default class Wrapper extends Node {
    constructor(el, component, name) {
        super(el, component, name, true);
        this.child = null;
    }

    mount() {
        if (this.child) this.child.mount();
    }

    unmount(detachChildrenFromParent = true) {
        if (this.child) {
            if (detachChildrenFromParent) {
                $.replace($.createComment(this.name), this.el);
            }

            this.child.unmount(detachChildrenFromParent);
            this.child = null;
        }
    }

    update(description) {
        let oldChild = this.child;

        if (description == null) {
            let placeHolder = $.createComment(this.name);
            $.replace(placeHolder, this.el);
            this.el = placeHolder;
            if (oldChild) oldChild.unmount();
            this.child = null;
        } else if (Array.isArray(description)) {
            error("unexpected Array. Root ($) wrapper nodes must be a single value");
        } else {
            let {props: childProps, type: Component, key = null} = description;

            if (oldChild && oldChild.instanceOfCheck(Component) && oldChild.key === key) {
                this.child.replaceProps(childProps);
            } else {
                let child = this._createComponent(description);
                let el = child.rootNode.el;

                $.replace(el, this.el);

                this.el = el;
                this.child = child;
                if (oldChild) oldChild.unmount();
                this._mountComponent(child);
            }
        }
    }

    _createComponent(description) {
        let parent = this.component;

        let {type: Component, props, create, key, ref} = description;

        let comp = create ? create(description, parent) : new Component(props, parent);

        if (key != null) comp.key = key;
        comp.initialize();
        if (ref) ref(comp.getRef());
        return comp;
    }

    _mountComponent(component) {
        if (this.component.hasMounted) {
            addMount(component);
        }
    }
}
