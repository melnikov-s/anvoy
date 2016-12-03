import {extend, warn, flatten, sequence} from './utils';
import Element from './core/nodes/element';
import Container from './core/nodes/container';
import Wrapper from './core/nodes/wrapper';
import Text from './core/nodes/text';

const METHODS = 'methods';
const ELEMENT_HOOKS = {
    'willInitialize': true,
    'didInitialize': true,
    'didMount': true,
    'willUpdate': true,
    'didUpdate': true,
    'willUnmount': true
};

export function getElementConstructor(behaviors = []) {
    behaviors = flatten(behaviors);

    let hooks;
    let methods;
    let Constructor = Element;

    for (let behaviorData of behaviors) {
        for (let key of Object.keys(behaviorData)) {
            let value = behaviorData[key];

            if (ELEMENT_HOOKS[key]) {
                if (!hooks) hooks = {};
                if (!hooks[key]) hooks[key] = [];
                hooks[key].push(value);
            } else if (key === METHODS) {
                if (!methods) methods = {};
                extend(methods, value);
            } else {
                warn(`unknown property in element behavior: '${key}'`);
            }
        }
    }

    if (hooks || methods) {
        Constructor = class extends Element {};

        for (let key of Object.keys(hooks || {})) {
            Constructor.prototype[key] = sequence(...hooks[key]);
        }

        if (methods) {
            Constructor.methods = methods;
        }
    }

    return Constructor;
}

export function getContainerConstructor(attrs) {
    let Constructor = Container;
    if (attrs) {
        Constructor = class extends Container {};
        Constructor.defaultProps = extend({}, attrs);
    }

    return Constructor;
}

export function getTextConstructor() {
    return Text;
}

export function getWrapperConstructor() {
    return Wrapper;
}
