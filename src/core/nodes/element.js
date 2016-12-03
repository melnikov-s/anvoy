import {error} from '../../utils';
import {default as $, elMethods, defaultElMethods} from '../../dom';
import eventMap from '../events';
import Node from './node';

let renderPriorityKeys = {
    class: true,
    style: true,
    detached: true,
    events: true
};

export default class Element extends Node {
    constructor(el, component, name) {
        super(el, component, name);
        this._events = {};
        this._eventsBound = false;
        this.placeHolder = null;
    }

    //lifecycle hooks
    didMount() {}
    willUpdate() {}
    didUpdate() {}
    willUnmount() {}

    attach() {
        if (this.placeHolder && this.el.parentNode == null) {
            $.replace(this.el, this.placeHolder);
            this.placeHolder = null;
        }
    }

    detach() {
        if (this.el.parentNode != null) {
            this.placeHolder = $.createComment('anvoy-placeholder');
            $.replace(this.placeHolder, this.el);
        }
    }

    mount() {
        this._subscribeEvents();
        this.didMount.call(this.component.behaviors, this.el);
    }

    preUpdate(props, state, prevProps, prevState) {
        this.willUpdate.call(
            this.component.behaviors, this.el, props, state, prevProps, prevState
        );
    }

    postUpdate(props, state, prevProps, prevState) {
        this.didUpdate.call(
            this.component.behaviors, this.el, props, state, prevProps, prevState
        );
    }

    unmount() {
        this.willUnmount.call(this.component.behaviors, this.el);
    }

    update(description = {}) {
        let customMethods = this.constructor.methods;
        let detached = false;
        let hasMounted = this.component && this.component.hasMounted;

        if ('detached' in description) {
            if (this.isRoot()) {
                error("can't detach a root node");
            }
            detached = description.detached;
            if (detached) {
                this.detach();
            } else {
                this.attach();
            }
        }

        if ('class' in description) {
            $.setAttr(this.el, 'class', description.class);
        }

        if ('style' in description) {
            $.setAttr(this.el, 'style', description.style);
        }

        if ('events' in description) {
            let events = description.events;
            for (let event of Object.keys(events)) {
                this._events[event] = events[event];
            }
        }

        if (!detached || !hasMounted) {
            for (let key of Object.keys(description)) {
                let value = description[key];

                if (eventMap[key]) {
                    this._events[eventMap[key]] = value;
                } else if (elMethods[key]) {
                    elMethods[key](this.el, value);
                } else if (customMethods && customMethods[key]) {
                    customMethods[key](this.el, value, hasMounted);
                } else if (defaultElMethods[key]) {
                    if (!hasMounted) {
                        defaultElMethods[key](this.el, value);
                    }
                } else if (!renderPriorityKeys[key]) {
                    $.setAttr(this.el, key, value);
                }
            }
        }
    }

    _subscribeEvents() {
        //if using element pooling events might already be bound
        if (this._eventsBound) return;

        for (let event of Object.keys(this._events)) {
            $.addEvent(this.el, event, (e) => {
                this._events[event].call(this.component.eventContext, this.el, e);
            });
        }

        this._eventsBound = true;
    }
}
