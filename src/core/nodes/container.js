import $ from '../../dom';
import {error} from '../../utils';
import {addMount} from '../scheduler';
import Node from './node';

export default class Container extends Node {
    constructor(el, component, name) {
        super(el, component, name);
        this.children = [];
        this._childrenMap = null;
    }

    mount() {
        for (let child of this.children) {
            child.mount();
        }
    }

    unmount(detachChildrenFromParent = true) {
        for (let child of this.children) {
            child.unmount(detachChildrenFromParent);
            if (detachChildrenFromParent) {
                $.remove(child.rootNode.el);
            }
        }

        this.children.length = 0;
        this._childrenMap = null;
    }

    update(descriptions) {
        if (descriptions == null) descriptions = [];

        descriptions = Array.isArray(descriptions) ? descriptions : [descriptions];

        if (descriptions.length && descriptions[0].key != null) {
            let isInitial = !this._childrenMap;

            if (isInitial) {
                this._updateWithoutKey(descriptions);
            } else {
                this._updateWithKey(descriptions, this._childrenMap);
            }

            this._childrenMap = this._genChildIndex(descriptions);
        } else {
            this._updateWithoutKey(descriptions);
            this._childrenMap = null;
        }
    }

    _applyDefaultProps(props) {
        let defaultProps = this.constructor.defaultProps;
        if (defaultProps) {
            for (let prop of Object.keys(defaultProps)) {
                if (props[prop] === undefined) {
                    props[prop] = defaultProps[prop];
                }
            }
        }

        return props;
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

    _genChildIndex(descriptions) {
        let keyIndex = {};
        for (let i = 0; i < descriptions.length; i++) {
            let {key, type} = descriptions[i];
            if (key == null) {
                error(
                    "one or more key attributes were null/undefined. All key attributes must be defined"
                );
            } else if (keyIndex[key]) {
                error(`duplicate key found: '${key}'. All keys must be unique`);
            }

            keyIndex[key] = {key, type, child: this.children[i]};
        }

        return keyIndex;
    }

    _mountComponent(component) {
        if (this.component.hasMounted) {
            addMount(component);
        }
    }

    _updateWithKey(descriptions, childrenMap) {
        let children = [];
        let oldChildren = this.children;
        let componentMap = {};

        for (let {key, type} of descriptions) {
            componentMap[key] = type;
        }

        //old children need to be removed first to prevent unnecessary DOM tree manipulation
        for (let child of oldChildren) {
            let Component = componentMap[child.key];
            if (!Component || !(child.instanceOfCheck(Component))) {
                child.unmount();
                $.remove(child.rootNode.el);
            }
        }

        //live DOM node collection
        let domNodes = $.childNodes($.parent(this.el));
        let placeHolderIndex = $.indexOfNode(this.el);

        for (let i = 0; i < descriptions.length; i++) {
            let description = descriptions[i];
            let {props, key} = description;

            this._applyDefaultProps(props);

            let {child} = childrenMap[key] || {};

            if (child && !child.isUnmounted) {
                let childEl = child.rootNode.el;

                if (domNodes[i + placeHolderIndex + 1] !== childEl) {
                    $.insertAfter(childEl, domNodes[i + placeHolderIndex]);
                }

                child.replaceProps(props);
            } else {
                child = this._createComponent(description);
                let childEl = child.rootNode.el;
                let lastEl = i === 0 ? this.el : children[i - 1].rootNode.el;

                $.insertAfter(childEl, lastEl);
                this._mountComponent(child);
            }

            children.push(child);
        }

        this.children = children;
    }

    _updateWithoutKey(descriptions) {
        let children = [];
        let oldChildren = this.children;

        for (let i = descriptions.length; i < this.children.length; i++) {
            let child = this.children[i];
            child.unmount();
            $.remove(child.rootNode.el);
        }

        for (let i = 0; i < descriptions.length; i++) {
            let description = descriptions[i];
            let {type: Component, props} = description;
            let child;
            let oldChild = oldChildren[i];

            this._applyDefaultProps(props);

            if (oldChild && !oldChild.isUnmounted && oldChild.instanceOfCheck(Component)) {
                child = oldChild;
                child.replaceProps(props);
            } else {
                child = this._createComponent(description);

                let childEl = child.rootNode.el;

                if (oldChild) {
                    $.replace(childEl, oldChild.rootNode.el);
                    oldChild.unmount();
                } else {
                    let lastEl = i === 0 ? this.el : children[i - 1].rootNode.el;
                    $.insertAfter(childEl, lastEl);
                }

                this._mountComponent(child);
            }

            children.push(child);
        }

        this.children = children;
    }
}
