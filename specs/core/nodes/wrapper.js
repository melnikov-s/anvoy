import Component from '../../../src/core/component';
import {setInstantMount} from '../../../src/core/scheduler';
import Element from '../../../src/core/nodes/element';
import Wrapper from '../../../src/core/nodes/wrapper';

describe("Wrapper: ", () => {
    let $template;
    let $templateChildA;
    let $templateChildB;
    let ChildA;
    let ChildB;

    function createWrapper({mounted = true, initialized = true} = {}) {
        let component = new Component();
        let wrapper;

        component.setNodes((component) => {
            wrapper = new Wrapper($template, component);
            return wrapper;
        });

        if (initialized) component.initialize();
        if (mounted) component.mount();

        return wrapper;
    }

    beforeEach(() => {
        $template = document.createElement('div');
        $template.setAttribute('id', 'wrapper');
        $templateChildA = document.createElement('div');
        $templateChildA.setAttribute('id', 'childA');

        $templateChildB = document.createElement('div');
        $templateChildB.setAttribute('id', 'childB');

        ChildA = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => new Element($templateChildA, component));
            }
        };

        ChildB = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => new Element($templateChildB, component));
            }
        };

        setInstantMount(true);
    });

    afterEach(() => {
        setInstantMount(false);
    });

    describe("when mounting", () => {
        it("mounts child component", () => {
            let wrapper = createWrapper({mounted: false, initialized: false});
            let description = {type: ChildA};

            wrapper.update(description);

            spyOn(wrapper.child, 'mount');

            wrapper.mount();

            expect(wrapper.child.mount).toHaveBeenCalled();
        });
    });

    describe("when updating", () => {
        it("adds the new component as a child of the wrapper", () => {
            let props = {num: 1};
            let description = function(props, state) {
                return {
                    type: ChildA,
                    props: {num: (props.num + state.num) * 2}
                };
            };

            let wrapper = createWrapper();

            wrapper.update(description(props, props));
            expect(wrapper.child.props).toEqual({num: 4});
            expect(wrapper.el).toBe($templateChildA);
            expect(wrapper.child instanceof ChildA).toBe(true);
        });

        it("resuses the old component instance if the constructors are equal", () => {
            let props = {num: 1};
            let description = function(props, state) {
                return {
                    type: ChildA,
                    props: {num: (props.num + state.num) * 2}
                };
            };

            let wrapper = createWrapper();

            wrapper.update(description(props, props));
            let oldChild = wrapper.child;
            expect(wrapper.child.props).toEqual({num: 4});
            spyOn(oldChild, 'replaceProps').and.callThrough();
            let newProps = {num: 2};
            wrapper.update(description(newProps, newProps));
            expect(oldChild.replaceProps).toHaveBeenCalled();
            expect(oldChild).toEqual(wrapper.child);
            expect(wrapper.child.props).toEqual({num: 8});
            expect(wrapper.el).toBe($templateChildA);
        });

        it("removes the old component instance if the constructors are not equal", () => {
            let description = function({type}, state) {
                let types = {a: ChildA, b: ChildB};

                return {
                    type: types[type],
                    props: {}
                };
            };

            let wrapper = createWrapper();

            wrapper.update(description({type: 'a'}));
            let oldChild = wrapper.child;
            spyOn(oldChild, 'unmount').and.callThrough();

            wrapper.update(description({type: 'b'}));
            expect(oldChild.unmount).toHaveBeenCalled();
            expect(wrapper.el).toBe($templateChildB);
            expect(wrapper.child instanceof ChildB).toBe(true);
        });

        it("allows for an empty/falsey component", () => {
            let description = function({type}, state) {
                let types = {a: ChildA};

                return types[type] ? {
                    type: types[type],
                    props: {}
                } : null;
            };

            let wrapper = createWrapper();

            wrapper.update(description({type: 'a'}));
            expect(wrapper.el.nodeType).not.toBe(8);

            let oldChild = wrapper.child;
            spyOn(oldChild, 'unmount').and.callThrough();

            wrapper.update(description({type: null}));

            expect(oldChild.unmount).toHaveBeenCalled();

            expect(wrapper.el.nodeType).toBe(8);
            expect(wrapper.child).toBe(null);
        });

        it("does not allow for an array of components", () => {
            let description = function(props, state) {
                return [{
                    type: ChildA
                }, {
                    type: ChildB
                }];
            };

            let wrapper = createWrapper();

            expect(() => wrapper.update(description({}))).toThrow(
                new Error("Anvoy: Unexpected Array. Root ($) wrapper nodes must be a single value.")
            );
        });

        it("allows for a ref function to get access to the underlying instance", () => {
            let childA;

            let description = function() {
                return {type: ChildA, ref: (c) => childA = c};
            };

            let wrapper = createWrapper();

            wrapper.update(description());

            expect(childA instanceof ChildA).toBe(true);
            expect(childA).toBe(wrapper.child);
        });
    });

    describe("when unmounting", () => {
        it("unmounts the child component", () => {
            let description = function(props, state) {
                return {
                    type: ChildA,
                    props: {}
                };
            };

            let wrapper = createWrapper();

            wrapper.update(description({}, {}));
            let oldChild = wrapper.child;
            spyOn(oldChild, 'unmount').and.callThrough();
            wrapper.unmount();
            expect(oldChild.unmount).toHaveBeenCalled();
        });
    });
});
