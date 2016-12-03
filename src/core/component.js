import {extend, error, warn, uniqueId} from '../utils';
import {scheduleUpdate, registerUpdateEnd, registerUpdateStart, flushChildrenUpdates} from './scheduler';

export let defaultBehaviors = {
    willMount() {},
    didMount() {},
    didUpdate(prevProps, prevState) {},
    getChildContext() {
        return null;
    },
    getInitialState(props) {
        return {};
    },
    render(props, state) {
        return null;
    },
    shouldUpdate(nextProps, nextState) {
        return true;
    },
    willReceiveProps(nextProps) {},
    willUpdate(nextProps, nextState) {},
    willUnmount() {}
};

export default class Component {
    constructor(props = {}, parent = null, behaviors = defaultBehaviors) {
        this.id = uniqueId();
        this.behaviors = behaviors;
        this.key = null;
        this.eventContext = this.behaviors;
        this.isUnmounted = false;
        this.isUpdating = false;
        this.hasMounted = false;
        this.hasInitialized = false;
        this.rootNode = null;
        this.nodes = null;

        if (parent) {
            this.depth = parent.depth + 1;
            this.hierarchy = extend({[parent.id]: true}, parent.hierarchy);
        } else {
            this.depth = 0;
            this.hierarchy = {};
        }

        this.props = props;
        this._nextState = this.state;
        this.context = null;
        this.state = null;
        this._nextState = null;

        this._stateUpdates = [];
        this._parent = parent;
        this._nextProps = this.props;
    }

    getRef() {
        return this.behaviors.getRef ? this.behaviors.getRef() : this;
    }

    initialize() {
        if (this.hasInitialized) error("can't initialize component that is already initialized");
        this.hasInitialized = true;
        this.isUpdating = true;

        this.context = this._parent ? this._parent._getFinalChildContext() : {};
        this.state = this.behaviors.getInitialState(this.props);
        this._nextState = this.state;

        try {
            this.behaviors.willMount();
            let renderData = this._getRenderData(this.props, this.state);
            for (let node of this.nodes) {
                node.update(renderData[node.name], this.props, this.state);
            }
        } finally {
            this.isUpdating = false;
        }
    }

    instanceOfCheck(Constructor) {
        if (this.behaviors === defaultBehaviors) {
            return this instanceof Constructor;
        }

        return this.behaviors instanceof Constructor;
    }

    mount() {
        if (!this.hasInitialized) error("can't mount a component that hasn't initialized");
        if (this.hasMounted) error("can't mount a component that is already mounted");

        this.hasMounted = true;

        for (let node of this.nodes) {
            node.mount();
        }

        this.behaviors.didMount();
    }

    replaceProps(values) {
        if (this.isUpdating) error("can't call `replaceProps` during an update");
        this._nextProps = values;
        this.update();
    }

    setNodes(getRootNode, getNodes) {
        if (this.hasInitialized) error("can't setNodes after component has initialized");

        this.rootNode = getRootNode(this);
        let nodes = getNodes ? getNodes(this) : [];
        this.nodes = [...nodes, this.rootNode];
    }

    setState(values) {
        if (this.isUpdating) error("can't call `setState` during an update");

        if (this._nextState === this.state) {
            this._nextState = extend({}, this.state);
        }

        if (typeof values === 'function') {
            this._stateUpdates.push(values);
        } else {
            extend(this._nextState, values);
        }

        scheduleUpdate(this);
    }

    update() {
        if (!this.hasMounted) error("can't update a component that hasn't mounted");
        if (this.isUpdating) error("can't update a component that is already updating");
        if (this.isUnmounted) {
            warn("can't update a unmounted component, this is a no-op");
            return;
        }

        registerUpdateStart(this);

        try {
            this._updateComponent();
        } finally {
            this.isUpdating = false;
            registerUpdateEnd(this);
        }
    }

    unmount(detachChildrenFromParent = false) {
        //for performane reasons we do not detach elements from a parent that will
        //themsleves get detached
        this.isUnmounted = true;

        this.behaviors.willUnmount();

        for (let node of this.nodes) {
            node.unmount(detachChildrenFromParent);
        }

        this._parent = null;
        this._key = null;
        this.nodes.length = 0;
    }

    //private methods
    _getFinalChildContext() {
        return extend({}, this.context, this.behaviors.getChildContext());
    }

    _getRenderData(props, state) {
        Component.currentRender = this;
        let renderData = this.behaviors.render(props, state);
        Component.currentRender = null;

        if (this.rootNode.soleNode) {
            return {root: renderData};
        }

        return renderData || {};
    }

    _updateComponent() {
        if (this._nextProps !== this.props) {
            this.behaviors.willReceiveProps(this._nextProps);
        }

        this.isUpdating = true;

        if (this._stateUpdates.length) {
            for (let stateUpdate of this._stateUpdates) {
                let updatedState = stateUpdate.call(this, this._nextState, this._nextProps);
                extend(this._nextState, updatedState);
            }

            this._stateUpdates.length = 0;
        }

        let nextProps = this._nextProps;
        let nextState = this._nextState;
        let prevProps = this._prevProps = this.props;
        let prevState = this._prevState = this.state;

        let shouldUpdate = this.behaviors.shouldUpdate(nextProps, nextState);

        if (shouldUpdate) this.behaviors.willUpdate(nextProps, nextState);

        this.props = nextProps;
        this.state = nextState;

        if (shouldUpdate) {
            for (let node of this.nodes) {
                node.preUpdate(this.props, this.state, prevProps, prevState);
            }

            let renderData = this._getRenderData(this.props, this.state);

            for (let node of this.nodes) {
                node.update(renderData[node.name], this.props, this.state, prevProps, prevState);
            }

            for (let node of this.nodes) {
                node.postUpdate(this.props, this.state, prevProps, prevState);
            }

            this.isUpdating = false;
            this.behaviors.didUpdate(prevProps, prevState);
        } else {
            flushChildrenUpdates(this);
            this.isUpdating = false;
        }
    }
}
