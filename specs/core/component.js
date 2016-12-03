import {default as Component, defaultBehaviors} from '../../src/core/component';
import Element from '../../src/core/nodes/element';
import Wrapper from '../../src/core/nodes/wrapper';
import {extend} from '../../src/utils';
import {x, y, incX, incY} from '../utils/counters';

describe("Component:", () => {
    function createComponent(props, parent, behaviors = {}) {
        let component = new Component(props, parent, extend({}, defaultBehaviors, behaviors));
        let root;
        let elements;
        let elRoot = document.createElement('div');
        let elA = document.createElement('div');
        let elB = document.createElement('div');
        elRoot.appendChild(elA);
        elRoot.appendChild(elB);

        component.setNodes((component) => {
            root = new Element(elRoot, component, 'root');
            return root;
        }, (component) => {
            elements = [
                new Element(elA, component, 'elementA'),
                new Element(elB, component, 'elementB')
            ];
            return elements;
        });

        return {component, root, elements};
    }

    function createInitializedComponent() {
        let {component, root, elements} = createComponent(...arguments);
        component.initialize();
        return {component, root, elements};
    }

    function createMountedComponent() {
        let {component, root, elements} = createInitializedComponent(...arguments);
        component.mount();
        return {component, root, elements};
    }

    describe("when setting nodes on a component", () => {
        it("should accept getRoot and getElement functions", () => {
            let component = new Component();
            let elRoot = document.createElement('div');
            let elA = document.createElement('div');
            let elB = document.createElement('div');
            elRoot.appendChild(elA);
            elRoot.appendChild(elB);

            component.setNodes((comp) => {
                expect(component).toBe(comp);
                incX();
                return new Element(elRoot, component, 'root');
            }, (comp) => {
                expect(component).toBe(comp);
                incY();
                return [
                    new Element(elA, component, 'elementA'),
                    new Element(elB, component, 'elementB')
                ];
            });

            expect(x).toBe(1);
            expect(y).toBe(1);
        });

        it("shouldn't require a getElement function", () => {
            let component = new Component();
            expect(
                () => component.setNodes((comp) => new Element(document.createElement('div'), comp))
            ).not.toThrow();
        });

        it("shouldn't be able to set nodes once a component has initialized", () => {
            let {component} = createInitializedComponent();
            expect(() => component.setNodes(function() {})).toThrow(
                new Error("Anvoy: Can't setNodes after component has initialized.")
            );
        });
    });

    describe("when a component is initialized", () => {
        it("sets the initial state from `getInitialState`", () => {
            let {component} = createInitializedComponent({propB: 'valueB'}, null, {
                getInitialState(props) {
                    return {propA: 'valueA', propB: props.propB};
                }
            });
            expect(component.state).toEqual({propA: 'valueA', propB: 'valueB'});
        });

        it("calls the `willMount` hook on the component", () => {
            let {component} = createComponent({propB: 'valueB'}, null, {
                willMount() {
                    incX();
                }
            });

            expect(x).toBe(0);
            component.initialize();
            expect(x).toBe(1);
        });

        it("updates all elements", () => {
            let props = {};
            let description = {root: {}, elementA: {}, elementB: {}};
            let {component, root, elements} = createComponent({}, null, {
                render() {
                    return description;
                }
            });

            spyOn(root, 'update');
            elements.forEach((element) => spyOn(element, 'update'));
            component.initialize();
            let state = component.state;
            expect(root.update).toHaveBeenCalledWith(description.root, props, state);
            elements.forEach((element) => {
                expect(element.update).toHaveBeenCalledWith(
                    description[element.name], props, state
                );
            });
        });

        it("can't call initialize twice", () => {
            let {component} = createComponent();
            component.initialize();
            expect(() => component.initialize()).toThrow(
                new Error("Anvoy: Can't initialize component that is already initialized.")
            );
        });
    });

    describe("when a component is mounted", () => {
        it("calls the `didMount` hook on the component", () => {
            let {component} = createInitializedComponent({}, null, {
                didMount() {
                    incX();
                }
            });

            component.mount();
            expect(x).toBe(1);
        });

        it("calls the `didMount` hooks on each element", () => {
            let {component, elements} = createInitializedComponent();

            elements[0].didMount = function(el) {
                expect(this).toBe(component.behaviors);
                expect(el).toBe(elements[0].el);
                incX();
            };

            elements[1].didMount = function(el) {
                expect(this).toBe(component.behaviors);
                expect(el).toBe(elements[1].el);
                incY();
            };

            component.mount();
            expect(x).toBe(1);
            expect(y).toBe(1);
        });

        it("can't be mounted twice", () => {
            let {component} = createInitializedComponent();
            component.mount();
            expect(() => component.mount()).toThrow(
                new Error("Anvoy: Can't mount a component that is already mounted.")
            );
        });

        it("can retrieve the mounted state of the component", () => {
            let {component} = createInitializedComponent();
            expect(component.hasMounted).toBe(false);
            component.mount();
            expect(component.hasMounted).toBe(true);
        });

        it("shouldn't be able to mount a component that hasn't initialized", () => {
            let {component} = createComponent();
            expect(() => component.mount()).toThrow(
                new Error("Anvoy: Can't mount a component that hasn't initialized.")
            );
        });
    });

    describe("when setting state", () => {
        it("will extend the previous state after an update", () => {
            let {component} = createMountedComponent();

            component.setState({attributeA: 'valueA'});
            component.setState({attributeB: 'valueB'});
            let oldState = component.state;
            jasmine.clock().tick(1);
            expect(component.state).toEqual({attributeA: 'valueA', attributeB: 'valueB'});
            expect(oldState).not.toBe(component.state);
        });

        it("can provide a function that will execute when the state is about to update", () => {
            let {component} = createMountedComponent();

            component.setState({count: 1});
            component.setState(({count}) => ({count: count + 1}));
            expect(component.state.count).toBeUndefined();
            jasmine.clock().tick(1);
            expect(component.state.count).toBe(2);
            component.setState(({count}) => ({count: count + 1}));
            component.setState(({count}) => ({count: count + 1}));
            jasmine.clock().tick(1);
            expect(component.state.count).toBe(4);
            component.replaceProps({newProps: true});
            component.setState(function({count}, props) {
                expect(this).toBe(component);
                expect(props.newProps).toBe(true);
                return {count: count + 1};
            });

            jasmine.clock().tick(1);
            expect(component.state.count).toBe(5);
        });

        it("can't `setState` during `willUpdate`", () => {
            let {component} = createComponent({}, null, {
                willUpdate() {
                    incX();
                    expect(() => component.setState({prop: 'value'})).toThrow(
                        new Error("Anvoy: Can't call `setState` during an update.")
                    );
                }
            });

            component.initialize();
            component.mount();
            component.update();
            expect(x).toBe(1);
        });

        it("can't `setState` during `shouldUpdate`", () => {
            let {component} = createComponent({}, null, {
                shouldUpdate() {
                    expect(() => component.setState({prop: 'value'})).toThrow(
                        new Error("Anvoy: Can't call `setState` during an update.")
                    );
                    incX();
                    return true;
                }
            });

            component.initialize();
            component.mount();
            component.update();
            expect(x).toBe(1);
        });

        it("can't `setState` during element `update`", () => {
            let {root, component} = createMountedComponent();

            root.update = function() {
                expect(() => this.component.setState({prop: 'value'})).toThrow(
                    new Error("Anvoy: Can't call `setState` during an update.")
                );
                incX();
            };

            component.update();
            expect(x).toBe(1);
        });

        it("can't `setState` during `setState` callback", () => {
            let {component} = createMountedComponent();

            component.setState(function() {
                expect(() => this.setState({prop: 'value'})).toThrow(
                    new Error("Anvoy: Can't call `setState` during an update.")
                );
                incX();
                return {};
            });

            jasmine.clock().tick(1);
            expect(x).toBe(1);
        });

        it("can `setState` during `didUpdate`", () => {
            let {component} = createComponent({}, null, {
                didUpdate() {
                    if (x === 0) {
                        expect(() => component.setState({prop: 'value'})).not.toThrow();
                        incX();
                    }
                }
            });

            component.initialize();
            component.mount();
            component.update();
            expect(x).toBe(1);
        });

        it("can `setState` during `didMount`", () => {
            let {component} = createComponent({}, null, {
                didMount() {
                    expect(() => component.setState({prop: 'value'})).not.toThrow();
                    incX();
                }
            });

            component.initialize();
            component.mount();
            expect(x).toBe(1);
        });

        it("can `setState` during element `mount`", () => {
            let {component, root} = createInitializedComponent();
            root.mount = function() {
                expect(() => this.component.setState({prop: 'value'})).not.toThrow();
                incX();
            };

            component.mount();
            expect(x).toBe(1);
        });
    });

    describe("when setting props", () => {
        it("will replace the previous props immediately", () => {
            let props = {attributeA: 'valueA'};
            let {component} = createMountedComponent(props);
            let oldProps = component.props;
            component.replaceProps({attributeB: 'valueB'});
            expect(component.props).toEqual({attributeB: 'valueB'});
            expect(oldProps).not.toBe(component.props);
        });
    });

    describe("when updating", () => {
        it("executes hooks in order", () => {
            let {component, root, elements} = createMountedComponent({}, null, {
                willUpdate() {
                    results.push('componentWillUpdate');
                },
                didUpdate() {
                    results.push('componentDidUpdate');
                }
            });

            let results = [];
            root.willUpdate = function(el) {
                expect(el).toBe(root.el);
                results.push('rootWillUpdate');
            };

            root.didUpdate = function(el) {
                expect(el).toBe(root.el);
                results.push('rootDidUpdate');
            };

            elements[0].willUpdate = function(el) {
                expect(el).toBe(elements[0].el);
                results.push('elementWillUpdate');
            };

            elements[0].didUpdate = function(el) {
                expect(el).toBe(elements[0].el);
                results.push('elementDidUpdate');
            };

            component.update();
            expect(results).toEqual([
                'componentWillUpdate', 'elementWillUpdate', 'rootWillUpdate',
                'elementDidUpdate', 'rootDidUpdate', 'componentDidUpdate'
            ]);
        });

        it("updates all nodes", () => {
            let description = {root: {}, elementA: {}, elementB: {}};
            let {component, root, elements} = createMountedComponent({}, null, {
                render() {
                    return description;
                }
            });

            let props = component.props;
            let state = component.state;

            spyOn(root, 'update');
            elements.forEach((element) => spyOn(element, 'update'));
            component.setState({});
            component.update();
            expect(root.update).toHaveBeenCalledWith(
                description.root, component.props, component.state, props, state
            );
            elements.forEach((element) => {
                expect(element.update).toHaveBeenCalledWith(
                    description[element.name], component.props, component.state, props, state
                );
            });
        });

        it("sets render description for root node when the root node is a sole node", () => {
            let rootDescription = {};
            let component = new Component({}, null, extend({}, defaultBehaviors, {
                render() {
                    return rootDescription;
                }
            }));
            let root;

            component.setNodes((component) => {
                root = new Wrapper(document.createComment(''), component, 'root');
                return root;
            });
            spyOn(root, 'update');
            component.initialize();

            expect(root.update.calls.argsFor(0)[0]).toBe(rootDescription);
        });

        it("does not proceed with the update if `shouldUpdate` hook returns false", () => {
            let {component} = createMountedComponent({}, null, {
                shouldUpdate() {
                    incX();
                    return false;
                },

                render() {
                    incX();
                },

                willUpdate() {
                    incY();
                },

                didUpdate() {
                    incY();
                }
            });

            component.update();
            expect(x).toBe(x);
            expect(y).toBe(0);
        });

        it("throws an error if trying to update a component that's already updating", () => {
            let {component} = createMountedComponent({}, null, {
                willUpdate() {
                    component.update();
                }
            });

            expect(() => component.update()).toThrow(
                new Error("Anvoy: Can't update a component that is already updating.")
            );
        });

        it("throws an error if trying to `setState` on a component that's already updating", () => {
            let {component} = createMountedComponent({}, null, {
                willUpdate() {
                    component.setState({prop: 'value'});
                }
            });

            expect(() => component.update()).toThrow(
                new Error("Anvoy: Can't call `setState` during an update.")
            );
        });

        it("throws an error if trying to `replaceProps` on a component that's already updating", () => {
            let {component} = createMountedComponent({}, null, {
                willUpdate() {
                    component.replaceProps({prop: 'value'});
                }
            });

            expect(() => component.update()).toThrow(
                new Error("Anvoy: Can't call `replaceProps` during an update.")
            );
        });

        it("shouldn't be able to update a component that hasn't mounted", () => {
            let {component} = createInitializedComponent();
            expect(() => component.update()).toThrow(
                new Error("Anvoy: Can't update a component that hasn't mounted.")
            );
        });
    });

    describe("when unmounted", () => {
        it("executes hooks in order", () => {
            let {component, root, elements} = createMountedComponent({}, null, {
                willUnmount() {
                    results.push('componentWillDestruct');
                }
            });

            let results = [];
            root.willUnmount = function(el) {
                expect(el).toBe(root.el);
                results.push('rootWillDestruct');
            };

            elements[0].willUnmount = function(el) {
                expect(el).toBe(elements[0].el);
                results.push('elementWillDestruct');
            };

            component.unmount();
            expect(results).toEqual([
                'componentWillDestruct', 'elementWillDestruct', 'rootWillDestruct'
            ]);
        });

        it("can query the unmounted state of the component", () => {
            let {component} = createMountedComponent();

            expect(component.isUnmounted).toBe(false);
            component.unmount();
            expect(component.isUnmounted).toBe(true);
        });

        it("updating results in a no-op", () => {
            let {component, root} = createMountedComponent();

            spyOn(console, 'warn');
            spyOn(root, 'update');
            spyOn(component.behaviors, 'willUpdate');
            component.unmount();
            component.update();
            expect(root.update).not.toHaveBeenCalled();
            expect(component.behaviors.willUpdate).not.toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
            component.setState({newState: true});
            component.update();
        });
    });
});
