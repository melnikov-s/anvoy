import {default as CoreComponent, defaultBehaviors} from '../core/component';
import {getNode} from '../ssr/resolve';
import {extend, flatten, uniqueId} from '../utils';
import {getFromPool, returnToPool} from '../nodePool';
import {getNodesFromParsedTemplate, parseTemplate} from '../template';
import {
    getElementConstructor,
    getWrapperConstructor,
    getContainerConstructor,
    getTextConstructor
} from '../nodeConstructors';

function getTemplateData(elSource, elementBehaviors = []) {
    elementBehaviors = flatten(elementBehaviors);

    let RootConstructor;
    let nodeConstructors = {};
    let elementBehaviorsByName = {};

    for (let elements of elementBehaviors) {
        for (let elementName of Object.keys(elements)) {
            if (!elementBehaviorsByName[elementName]) elementBehaviorsByName[elementName] = [];
            elementBehaviorsByName[elementName].push(elements[elementName]);
        }
    }

    let template = parseTemplate(elSource);
    let {rootElData, elMeta} = template;

    if (rootElData.type !== 'element') {
        RootConstructor = getWrapperConstructor();
    } else {
        RootConstructor = getElementConstructor(elementBehaviorsByName.root);

        for (let {type, name, attrs} of elMeta) {
            let Constructor;

            if (type === 'element') {
                Constructor = getElementConstructor(elementBehaviorsByName[name]);
            } else if (type === 'comment') {
                Constructor = getContainerConstructor(attrs);
            } else if (type === 'text') {
                Constructor = getTextConstructor();
            }
            nodeConstructors[name] = Constructor;
        }
    }

    return {id: uniqueId(), RootConstructor, nodeConstructors, template};
}

function getTemplate(Component) {
    if (!Component.hasOwnProperty('__parsedTemplateData__')) {
        let el = typeof Component.el === 'function' ? Component.el() : Component.el;
        let elements = typeof Component.elements === 'function' ?
            Component.elements() : Component.elements;

        Component.__parsedTemplateData__ = getTemplateData(el, elements);
    }

    return Component.__parsedTemplateData__;
}

export function getCoreInstance(component) {
    return component.__coreInstance;
}

export default class Component {
    static getDefaultProps() {
        return {};
    }

    constructor(props, parent) {
        let component = new CoreComponent(props, parent, this);
        let Ctor = this.constructor;
        let usePool = Ctor.enableElementRecycling && Ctor.enableElementRecycling();
        let templateData = getTemplate(Ctor);
        let {id, template, RootConstructor, nodeConstructors} = templateData;
        let {builtRoot, builtNodes} = getFromPool(id) || [];
        let [rootTemplateData, ...nodesTemplateData] = getNodesFromParsedTemplate(template);

        let rootBuilder = (component) => {
            if (builtRoot) {
                builtRoot.component = component;
            } else {
                let parentEl = parent && parent.rootNode.el;
                let el = getNode(rootTemplateData.el, parentEl);
                builtRoot = new RootConstructor(el, component, 'root', true);
            }

            return builtRoot;
        };

        let nodesBuilder = (component) => {
            if (builtNodes) {
                for (let builtNode of builtNodes) {
                    builtNode.component = component;
                }
            } else {
                builtNodes = [];

                for (let {name, el: templateEl} of nodesTemplateData) {
                    let Constructor = nodeConstructors[name];
                    let el = getNode(templateEl, component.rootNode.el);
                    builtNodes.push(new Constructor(el, component, name));
                }
            }

            return builtNodes;
        };

        component.setNodes(rootBuilder, nodesBuilder);

        if (usePool) {
            let unmount = component.unmount;
            component.unmount = function() {
                returnToPool(id, {builtRoot, builtNodes});
                return unmount.call(this, true);
            };
        }

        this.__coreInstance = component;
    }

    getEl(name) {
        let nodes = this.__coreInstance.nodes;
        let el = null;

        for (let node of nodes) {
            if (node.name === name) {
                el = node.el;
                break;
            }
        }

        return el;
    }

    getEls(...names) {
        let nodes = this.__coreInstance.nodes;
        let els = [];

        for (let name of names) {
            for (let node of nodes) {
                if (node.name === name) {
                    els.push(node.el);
                }
            }
        }

        return els;
    }

    getRef() {
        return this;
    }

    getRootEl() {
        return this.__coreInstance.rootNode.el;
    }

    get props() {
        return this.__coreInstance.props;
    }

    setState(partialState) {
        this.__coreInstance.setState(partialState);
    }

    get state() {
        return this.__coreInstance.state;
    }

    get context() {
        return this.__coreInstance.context;
    }
}

extend(Component.prototype, defaultBehaviors);
