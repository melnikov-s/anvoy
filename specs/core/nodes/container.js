import Component from '../../../src/core/component';
import {setInstantMount} from '../../../src/core/scheduler';
import Element from '../../../src/core/nodes/element';
import Container from '../../../src/core/nodes/container';
import elsEqual from '../../utils/elsEqual';

describe("Container:", () => {
    let $template;
    let $placeHolder;
    let $templateChildA;
    let $templateChildB;
    let $templateChildC;
    let $templateChildD;
    let ChildA;
    let ChildB;
    let ChildC;
    let ChildD;

    function createContainer({mounted = true, initialized = true} = {}) {
        let container;

        let component = new Component({});

        component.setNodes((component) => {
            container = new Container($placeHolder, component);
            return container;
        });

        if (initialized) component.initialize();
        if (mounted) component.mount();

        return container;
    }

    beforeEach(() => {
        $placeHolder = document.createComment('');

        $template = document.createElement('div');
        $template.setAttribute('id', 'container');

        $template.appendChild($placeHolder);

        $templateChildA = document.createElement('div');
        $templateChildA.setAttribute('id', 'childA');

        $templateChildB = document.createElement('div');
        $templateChildB.setAttribute('id', 'childB');

        $templateChildC = document.createElement('div');
        $templateChildC.setAttribute('id', 'childC');

        $templateChildD = document.createElement('div');
        $templateChildD.setAttribute('id', 'childD');

        ChildA = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => {
                    return new Element($templateChildA.cloneNode(), component);
                });
            }
        };

        ChildB = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => {
                    return new Element($templateChildB.cloneNode(), component);
                });
            }
        };

        ChildC = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => {
                    return new Element($templateChildC.cloneNode(), component);
                });
            }
        };

        ChildD = class extends Component {
            constructor(props, parent) {
                super(props, parent);
                this.setNodes((component) => {
                    return new Element($templateChildD.cloneNode(), component);
                });
            }
        };
        setInstantMount(true);
    });

    afterEach(() => {
        setInstantMount(false);
    });

    describe("when mounting", () => {
        it("mounts all child components", () => {
            let container = createContainer({mounted: false, initialized: false});
            let description = [
                {type: ChildA},
                {type: ChildB},
                {type: ChildC}
            ];

            container.update(description);
            container.children.forEach((child) => {
                spyOn(child, 'mount');
            });
            container.mount();

            container.children.forEach((child) => {
                expect(child.mount).toHaveBeenCalled();
            });
        });
    });

    describe("when updating without a key", () => {
        it("adds child components from an empty state", () => {
            let description = function({propA}, {propB}) {
                return [
                    {
                        type: ChildA,
                        props: {propA, propB, prop: 'a'}
                    },
                    {
                        type: ChildB,
                        props: {propA, propB, prop: 'b'}
                    },
                    {
                        type: ChildA,
                        props: {propA, propB, prop: 'c'}
                    }
                ];
            };

            let container = createContainer();

            let propA = {};
            let propB = {};

            expect(container.children.length).toBe(0);
            container.update(description({propA}, {propB}));
            let elChildren = container.el.parentNode.children;
            expect(elChildren.length).toBe(3);
            expect(elsEqual(elChildren[0], $templateChildA)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildB)).toBe(true);
            expect(elsEqual(elChildren[2], $templateChildA)).toBe(true);

            let children = container.children;
            expect(children.length).toBe(3);
            expect(children[0].props).toEqual({propA, propB, prop: 'a'});
            expect(children[1].props).toEqual({propA, propB, prop: 'b'});
            expect(children[2].props).toEqual({propA, propB, prop: 'c'});
            expect(children[0] instanceof ChildA).toBe(true);
            expect(children[1] instanceof ChildB).toBe(true);
            expect(children[2] instanceof ChildA).toBe(true);
        });

        it("adds additional components if necessary", () => {
            let components;
            let propA = {};

            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = ({propA}) => [{type: ChildA, props: {propA}}];

            container.update(description({propA}));
            expect(container.children.length).toBe(1);

            let childA = container.children[0];
            expect(childA.props.propA).toBe(propA);

            components = ({propA}) => [
                {type: ChildA, props: {propA}},
                {type: ChildB, props: {propA}},
                {type: ChildC, props: {propA}}
            ];

            container.update(description({propA}));
            expect(container.children.length).toBe(3);
            expect(container.children[0]).toBe(childA);
            expect(container.children[1] instanceof ChildB).toBe(true);
            expect(container.children[2] instanceof ChildC).toBe(true);

            let elChildren = container.el.parentNode.children;
            expect(elsEqual(elChildren[0], $templateChildA)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildB)).toBe(true);
            expect(elsEqual(elChildren[2], $templateChildC)).toBe(true);
        });

        it("removes extraneous components if necessary", () => {
            let components;
            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [
                {type: ChildA},
                {type: ChildB},
                {type: ChildC}
            ];

            container.update(description({}, {}));
            expect(container.children.length).toBe(3);
            let childB = container.children[1];
            spyOn(childB, 'unmount').and.callThrough();
            let childC = container.children[2];
            spyOn(childC, 'unmount').and.callThrough();

            components = () => [{type: ChildA}];

            container.update(description({}, {}));
            expect(container.children.length).toBe(1);
            expect(childB.unmount).toHaveBeenCalled();
            expect(childC.unmount).toHaveBeenCalled();
        });

        it("reuses components that have matching constructors", () => {
            let components;
            let propA;

            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = ({propA}) => [
                {type: ChildA, props: {propA}},
                {type: ChildA, props: {propA}},
                {type: ChildA, props: {propA}}
            ];

            propA = {};
            container.update(description({propA}));

            let firstChild = container.children[0];
            let secondChild = container.children[1];
            let thirdChild = container.children[2];

            container.children.forEach((child) => expect(child.props.propA).toBe(propA));

            components = ({propA}) => [
                {type: ChildB, props: {propA}},
                {type: ChildA, props: {propA}},
                {type: ChildC, props: {propA}}
            ];

            propA = {};
            container.update(description({propA}));

            expect(container.children[0] instanceof ChildB).toBe(true);
            expect(container.children[1] instanceof ChildA).toBe(true);
            expect(container.children[2] instanceof ChildC).toBe(true);

            expect(firstChild).not.toBe(container.children[0]);
            expect(secondChild).toBe(container.children[1]);
            expect(thirdChild).not.toBe(container.children[2]);

            container.children.forEach((child) => expect(child.props.propA).toBe(propA));
        });

        it("allows for a single child component", () => {
            let description = function() {
                return {
                    type: ChildA
                };
            };

            let container = createContainer();

            container.update(description({}, {}));
            expect(container.children.length).toBe(1);
            expect(container.children[0] instanceof ChildA).toBe(true);
        });

        it("empties all components when an empty children array is returned", () => {
            let components;

            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [
                {type: ChildA},
                {type: ChildB},
                {type: ChildC}
            ];

            container.update(description({}, {}));
            expect(container.children.length).toBe(3);

            components = () => [];

            container.update(description({}, {}));
            expect(container.children.length).toBe(0);
            expect(container.el.innerHTML).toBe(undefined);
        });

        it("allows for a ref function to get access to the underlying instance", () => {
            let childA;
            let childB;

            let description = function() {
                return [
                    {type: ChildA, ref: (c) => childA = c},
                    {type: ChildB, ref: (c) => childB = c}
                ];
            };

            let container = createContainer();

            container.update(description({}, {}));

            expect(childA instanceof ChildA).toBe(true);
            expect(childB instanceof ChildB).toBe(true);
            expect(childA).toBe(container.children[0]);
            expect(childB).toBe(container.children[1]);
        });

        it("populates the default props", () => {
            let container = createContainer();

            container.constructor.defaultProps = {
                propA: 'valueA',
                propB: 'valueB'
            };

            container.update([
                {type: ChildA, props: {propB: 'newValueB'}},
                {type: ChildB, props: {}}
            ]);

            let [childA, childB] = container.children;
            expect(childA.props).toEqual({propA: 'valueA', propB: 'newValueB'});
            expect(childB.props).toEqual({propA: 'valueA', propB: 'valueB'});
            container.constructor.defaultProps = undefined;
        });
    });

    describe("when updating with a key", () => {
        it("matches up the components that share keys", () => {
            let components;
            let propA;

            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = ({propA}) => [
                {type: ChildA, key: 'a', props: {propA}},
                {type: ChildB, key: 'b', props: {propA}},
                {type: ChildC, key: 'c', props: {propA}}
            ];

            propA = {};
            container.update(description({propA}));
            expect(container.children.length).toBe(3);
            container.children.forEach((child) => expect(child.props.propA).toBe(propA));

            let [childA, childB, childC] = container.children;

            expect(childA instanceof ChildA).toBe(true);
            expect(childB instanceof ChildB).toBe(true);
            expect(childC instanceof ChildC).toBe(true);

            let elChildren = container.el.parentNode.children;
            expect(elChildren.length).toBe(3);
            expect(elsEqual(elChildren[0], $templateChildA)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildB)).toBe(true);
            expect(elsEqual(elChildren[2], $templateChildC)).toBe(true);

            components = ({propA}) => [
                {type: ChildC, key: 'c', props: {propA}},
                {type: ChildD, key: 'd', props: {propA}},
                {type: ChildB, key: 'b', props: {propA}}
            ];

            propA = {};
            container.update(description({propA}));
            expect(container.children.length).toBe(3);
            container.children.forEach((child) => expect(child.props.propA).toBe(propA));

            expect(container.children[0]).toBe(childC);
            expect(container.children[1] instanceof ChildD).toBe(true);
            expect(container.children[2]).toBe(childB);

            elChildren = container.el.parentNode.children;
            expect(elChildren.length).toBe(3);
            expect(elsEqual(elChildren[0], $templateChildC)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildD)).toBe(true);
            expect(elsEqual(elChildren[2], $templateChildB)).toBe(true);
        });

        it("adds additional components if necessary", () => {
            let components;

            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [{type: ChildA, key: 'a'}];

            container.update(description({}, {}));
            expect(container.children.length).toBe(1);

            let childA = container.children[0];

            components = () => [
                {type: ChildA, key: 'a'},
                {type: ChildB, key: 'b'},
                {type: ChildC, key: 'c'}
            ];

            container.update(description({}, {}));
            expect(container.children.length).toBe(3);
            expect(container.children[0]).toBe(childA);
            expect(container.children[1] instanceof ChildB).toBe(true);
            expect(container.children[2] instanceof ChildC).toBe(true);

            let elChildren = container.el.parentNode.children;
            expect(elsEqual(elChildren[0], $templateChildA)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildB)).toBe(true);
            expect(elsEqual(elChildren[2], $templateChildC)).toBe(true);
        });

        it("removes extraneous components if necessary", () => {
            let components;
            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [
                {type: ChildA, key: 'a'},
                {type: ChildB, key: 'b'},
                {type: ChildC, key: 'c'}
            ];

            container.update(description({}, {}));
            expect(container.children.length).toBe(3);
            let childB = container.children[1];
            spyOn(childB, 'unmount').and.callThrough();
            let childC = container.children[2];
            spyOn(childC, 'unmount').and.callThrough();

            components = () => [{type: ChildA, key: 'a'}];

            container.update(description({}, {}));
            expect(container.children.length).toBe(1);
            expect(childB.unmount).toHaveBeenCalled();
            expect(childC.unmount).toHaveBeenCalled();
        });

        it("does not match keyed components with differing constructors", () => {
            let components;
            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [
                {type: ChildA, key: 'a'},
                {type: ChildB, key: 'b'}
            ];

            container.update(description());
            let childA = container.children[0];
            let childB = container.children[1];
            spyOn(childB, 'unmount').and.callThrough();

            components = () => [
                {type: ChildA, key: 'a'},
                {type: ChildC, key: 'b'}
            ];

            container.update(description());
            expect(childA).toBe(container.children[0]);
            expect(childB.unmount).toHaveBeenCalled();
            expect(container.children[1] instanceof ChildC).toBe(true);
        });

        it("replaces all components if no keys match", () => {
            let components;
            let description = function() {
                return components(...arguments);
            };

            let container = createContainer();

            components = () => [
                {type: ChildA, key: 'a'},
                {type: ChildB, key: 'b'}
            ];

            container.update(description());
            let childA = container.children[0];
            let childB = container.children[1];

            components = () => [
                {type: ChildC, key: 'c'},
                {type: ChildD, key: 'd'}
            ];

            container.update(description());
            expect(childA.isUnmounted).toBe(true);
            expect(childB.isUnmounted).toBe(true);
            let childC = container.children[0];
            let childD = container.children[1];
            expect(childC instanceof ChildC).toBe(true);
            expect(childD instanceof ChildD).toBe(true);

            let elChildren = container.el.parentNode.children;
            expect(elChildren.length).toBe(2);
            expect(elsEqual(elChildren[0], $templateChildC)).toBe(true);
            expect(elsEqual(elChildren[1], $templateChildD)).toBe(true);
        });

        it("enforces that all keys are defined when updating", () => {
            let description = function() {
                return [
                    {type: ChildA, key: 'a'},
                    {type: ChildB}
                ];
            };

            let container = createContainer();

            expect(() => container.update(description({}, {}))).toThrow(
                new Error(
                    "Anvoy: One or more key attributes were null/undefined. " +
                    "All key attributes must be defined."
                )
            );
        });

        it("enforces that all keys are unique when updating", () => {
            let description = function() {
                return [
                    {type: ChildA, key: 'a'},
                    {type: ChildC, key: 'c'},
                    {type: ChildB, key: 'a'}
                ];
            };

            let container = createContainer();

            expect(() => container.update(description({}, {}))).toThrow(
                new Error(
                    "Anvoy: Duplicate key found: 'a'. All keys must be unique."
                )
            );
        });

        it("allows for a ref function to get access to the underlying instance", () => {
            let childA;
            let childB;
            let firstRun = true;

            let first = [
                {type: ChildA, ref: (c) => childA = c, key: 0}
            ];

            let second = [
                {type: ChildA, ref: (c) => childA = c, key: 0},
                {type: ChildB, ref: (c) => childB = c, key: 1}
            ];

            let description = function() {
                let results = firstRun ? first : second;
                firstRun = false;
                return results;
            };

            let container = createContainer();

            container.update(description({}, {}));
            container.update(description({}, {}));

            expect(childA instanceof ChildA).toBe(true);
            expect(childB instanceof ChildB).toBe(true);
            expect(childA).toBe(container.children[0]);
            expect(childB).toBe(container.children[1]);
        });

        it("populates the default props", () => {
            let container = createContainer();

            container.constructor.defaultProps = {
                propA: 'valueA',
                propB: 'valueB'
            };

            let description = [
                {type: ChildA, props: {propB: 'newValueB'}, key: 1},
                {type: ChildB, props: {}, key: 2}
            ];

            container.update(description);
            container.update(description);

            let [childA, childB] = container.children;
            expect(childA.props).toEqual({propA: 'valueA', propB: 'newValueB'});
            expect(childB.props).toEqual({propA: 'valueA', propB: 'valueB'});

            container.constructor.defaultProps = undefined;
        });
    });

    describe("when unmounting", () => {
        it("unmounts the children component", () => {
            let description = function() {
                return [
                    {type: ChildA},
                    {type: ChildB},
                    {type: ChildC}
                ];
            };

            let container = createContainer();

            container.update(description({}, {}));

            let childA = container.children[0];
            spyOn(childA, 'unmount').and.callThrough();
            let childB = container.children[1];
            spyOn(childB, 'unmount').and.callThrough();
            let childC = container.children[2];
            spyOn(childC, 'unmount').and.callThrough();

            container.unmount();
            expect(childA.unmount).toHaveBeenCalled();
            expect(childB.unmount).toHaveBeenCalled();
            expect(childC.unmount).toHaveBeenCalled();
        });
    });
});
