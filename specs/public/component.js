import {Component, render, unmount, create} from '../../src/index';
import {x, incX, y, incY, z, incZ} from '../utils/counters';
import triggerDomEvent from '../utils/triggerDomEvent';

let doc;

beforeEach(() => {
    doc = document.createElement('div');
});

describe("component behaviors:", () => {
    it("throws an error if an invalid el value is provided", () => {
        let C = class extends Component {
            static el() {
                return {};
            }
        };

        expect(() => render(create(C), doc)).toThrow(
            new Error("Anvoy: Not a valid el value, must be a HTML string got object.")
        );
    });

    it("accepts an HTML string from the el function", () => {
        let el = '<div><span></span></div>';
        let C = class extends Component {
            static el() {
                return el;
            }
        };
        render(create(C, {key: 0}), doc);
        expect(doc.firstChild.innerHTML.toLowerCase()).toBe("<span></span>");
        expect(doc.firstChild.tagName.toUpperCase()).toBe('DIV');
        let last = doc.firstChild;
        render(create(C, {key: 1}), doc);
        expect(doc.firstChild).not.toBe(last);
    });

    it("accepts an HTML string as an el property", () => {
        let C = class extends Component {};
        C.el = '<span></span>';
        render(create(C), doc);
        expect(doc.innerHTML).toBe("<span></span>");
    });

    it("sets the root node to be a Wraper if no `el` is provided", () => {
        let Child = class extends Component {
            static el() {
                return `<span>Hello</span>`;
            }
        };

        let C = class extends Component {
            render() {
                return create(Child);
            }
        };

        render(create(C), doc);
        expect(doc.innerHTML).toBe('<span>Hello</span>');
    });

    it("updates elements in the order of DOM depth", () => {
        let results = [];

        let Child = class extends Component {
            didMount() {
                results.push('didMountChild');
            }

            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount: () => results.push('didMount$Child'),
                        willUpdate: () => results.push('update$Child')
                    }
                };
            }
        };

        let C = class extends Component {
            didMount() {
                results.push('didMount');
            }

            static el() {
                return `
                    <div>
                        <span @elemA><span @elemB><span/></span>
                        <div>
                            <div>
                                <div>
                                    <span @elemC></span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div>
                                <@elemD/>
                            </div>
                        </div>
                    </div>
                `;
            }
            static elements() {
                return {
                    root: {
                        didMount: () => results.push('didMount$'),
                        willUpdate: () => results.push('update$')
                    },
                    elemA: {
                        didMount: () => results.push('didMount$A'),
                        willUpdate: () => results.push('update$A')
                    },
                    elemB: {
                        didMount: () => results.push('didMount$B'),
                        willUpdate: () => results.push('update$B')
                    },
                    elemC: {
                        didMount: () => results.push('didMount$C'),
                        willUpdate: () => results.push('update$C')
                    }
                };
            }
            render() {
                return {
                    elemD: create(Child)
                };
            };
        };

        render(create(C, {}), doc);
        render(create(C, {}), doc);

        expect(results).toEqual([
            'didMount$C', 'didMount$Child', 'didMountChild', 'didMount$B', 'didMount$A',
            'didMount$', 'didMount', 'update$C', 'update$B', 'update$A', 'update$', 'update$Child'
        ]);
    });

    it("executes hooks", () => {
        let results = [];

        let C = class extends Component {
            willMount() {
                expect(this instanceof C).toBe(true);
                results.push('componentWillMount');
            }

            didMount() {
                expect(this instanceof C).toBe(true);
                results.push('componentDidMount');
            }

            willUpdate() {
                expect(this instanceof C).toBe(true);
                results.push('componentWillUpdate');
            }

            didUpdate() {
                expect(this instanceof C).toBe(true);
                results.push('componentDidUpdate');
            }

            willUnmount() {
                expect(this instanceof C).toBe(true);
                results.push('componentWillUnmount');
            }

            shouldUpdate() {
                expect(this instanceof C).toBe(true);
                results.push('componentShouldUpdate');
                return true;
            }

            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount() {
                            expect(this instanceof C).toBe(true);
                            results.push('elementDidMount');
                        },

                        willUpdate(el) {
                            expect(this instanceof C).toBe(true);
                            expect(el.nodeType).toBe(1);
                            results.push('elementWillUpdate');
                        },

                        didUpdate(el) {
                            expect(this instanceof C).toBe(true);
                            expect(el.nodeType).toBe(1);
                            results.push('elementDidUpdate');
                        },

                        willUnmount(el) {
                            expect(this instanceof C).toBe(true);
                            expect(el.nodeType).toBe(1);
                            results.push('elementWillUnmount');
                        }
                    }
                };
            }
        };

        render(create(C, {}), doc);
        render(create(C, {foo: 'bar'}), doc);
        unmount(doc);
        expect(results).toEqual([
            'componentWillMount',
            'elementDidMount',
            'componentDidMount',
            'componentShouldUpdate',
            'componentWillUpdate',
            'elementWillUpdate',
            'elementDidUpdate',
            'componentDidUpdate',
            'componentWillUnmount',
            'elementWillUnmount'
        ]);
    });

    it("executes 'didMount' hooks on elements when the component is mounted", () => {
        let results = [];

        let ChildA = class extends Component {
            didMount() {
                results.push('mountChildA');
            }

            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            expect(el.nodeType).toBe(1);
                            results.push('mountChildA$');
                        }
                    }
                };
            }
        };

        let ChildC = class extends Component {
            didMount() {
                results.push('mountChildC');
            }

            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            expect(el.nodeType).toBe(1);
                            results.push('mountChildC$');
                        }
                    }
                };
            }
        };

        let GrandChildB = class extends Component {
            didMount() {
                results.push('mountGrandChildB');
            }

            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            expect(el.nodeType).toBe(1);
                            results.push('mountGrandChildB$');
                        }
                    }
                };
            }
        };

        let ChildB = class extends Component {
            didMount() {
                results.push('mountChildB');
            }

            render() {
                return create(GrandChildB);
            }
        };

        let C = class extends Component {
            didMount() {
                results.push('mountC');
            }

            static el() {
                return `<div><@childA/> <@childrenB/> <span @elem></span></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            expect(el.nodeType).toBe(1);
                            expect(el.parentNode).toBe(doc);
                            results.push('mountC$');
                        }
                    },
                    elem: {
                        didMount(el) {
                            expect(el.nodeType).toBe(1);
                            results.push('mountC$elem');
                        }
                    }
                };
            }

            render() {
                return {
                    childA: create(ChildA),
                    childrenB: [
                        create(ChildB, {key: 0}),
                        create(ChildB, {key: 1}),
                        create(ChildC, {key: 2 + incX()})
                    ]
                };
            }
        };

        render(create(C, {}), doc);
        expect(results).toEqual([
            'mountChildA$', 'mountChildA', 'mountGrandChildB$', 'mountGrandChildB',
            'mountChildB', 'mountGrandChildB$', 'mountGrandChildB', 'mountChildB', 'mountChildC$',
            'mountChildC', 'mountC$elem', 'mountC$', 'mountC'
        ]);

        results = [];
        render(create(C, {}), doc);
        render(create(C, {}), doc);
        expect(results).toEqual([
            'mountChildC$', 'mountChildC', 'mountChildC$', 'mountChildC'
        ]);

        unmount(doc);
    });

    it("executes 'didMount' hooks on Components that have been added to a mounted parent", () => {
        let GrandChild = class extends Component {
            static el() {
                return `<div></div>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            incZ();
                            expect(doc.contains(el)).toBe(true);
                        }
                    }
                };
            }
        };

        let Child = class extends Component {
            didMount() {
                expect(doc.contains(this.getRootEl())).toBe(true);
                incY();
            }

            render({mountChild}) {
                return mountChild ? create(GrandChild) : null;
            }
        };

        let Parent = class extends Component {
            static el() {
                return `<div><@child/></div>`;
            }

            didMount() {
                incX();
            }

            render({mountChild, mountGrandChild}) {
                return {
                    child: mountChild ? create(Child, {mountChild: mountGrandChild}) : null
                };
            }
        };

        render(create(Parent, {mountChild: false}), doc);
        expect(x).toBe(1);
        expect(y).toBe(0);
        expect(z).toBe(0);

        render(create(Parent, {mountChild: true}), doc);
        expect(x).toBe(1);
        expect(y).toBe(1);
        expect(z).toBe(0);

        render(create(Parent, {mountGrandChild: true, mountChild: true}), doc);
        expect(x).toBe(1);
        expect(y).toBe(1);
        expect(z).toBe(1);
    });

    it("updates components in order of their depth; preventing double updating", () => {
        let childComp;

        let ChildComp = class extends Component {
            willUpdate() {
                incX();
            }
        };

        let ParentComp = class extends Component {
            willUpdate() {
                incY();
            }
            render() {
                return create(ChildComp, {ref: (c) => childComp = c});
            }
        };

        let parentComp;
        render(create(ParentComp, {ref: (comp) => parentComp = comp}), doc);

        childComp.setState({prop: 'value'});
        parentComp.setState({prop: 'value'});
        jasmine.clock().tick(1);
        expect(x).toBe(1);
        expect(y).toBe(1);
        parentComp.setState({prop: 'value'});
        childComp.setState({prop: 'value'});
        jasmine.clock().tick(1);
        expect(x).toBe(2);
        expect(y).toBe(2);
    });

    it("supports marked attributes on elements", () => {
        let C = class extends Component {

            static el() {
                return `
                    <div>
                        <span @elementA></span>
                        <span @elementB></span>
                    </div>
                `;
            }

            render({propA, propB}) {
                return {
                    elementA: {
                        text: propA
                    },
                    elementB: {
                        text: propB
                    }
                };
            }
        };

        render(create(C, {propA: 'elementA', propB: 'elementB'}), doc);

        expect(doc.firstChild.innerHTML.trim()).toBe(
            '<span>elementA</span><span>elementB</span>'
        );
    });

    it("defaults to comments for wrappers and containers", () => {
        let C = class extends Component {
            static el() {
                return '<div><@nodeA/><@nodeB/></div>';
            }
        };

        render(create(C, {}), doc);

        let childNodes = doc.firstChild.childNodes;

        expect(childNodes.length).toBe(2);
        expect(childNodes[0].nodeType).toBe(8);
        expect(childNodes[1].nodeType).toBe(8);
    });

    it("can pass down context to child components", () => {
        let ChildA = class extends Component {
            didMount() {
                expect(this.context.typeA).toBe(0);
            }
        };

        let GrandChildB = class extends Component {
            didMount() {
                expect(this.context.typeA).toBe(0);
                expect(this.context.typeB).toBe(0);
                incX();
            }
        };

        let ChildB = class extends Component {
            static getDefaultProps() {
                return {typeB: 0};
            }

            getChildContext() {
                return {typeB: this.props.typeB};
            }

            didMount() {
                expect(this.context.typeA).toBe(0);
            }

            render() {
                return create(GrandChildB);
            }
        };

        let C = class extends Component {
            getInitialState() {
                return {typeA: 0};
            }

            getChildContext() {
                return {typeA: this.state.typeA};
            }

            static el() {
                return `<div><@childA/> <@childrenB/></div>`;
            }

            render() {
                return {
                    childA: create(ChildA),
                    childrenB: [
                        create(ChildB),
                        create(ChildB),
                        create(ChildB),
                        create(ChildB)
                    ]
                };
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);

        c.setState({typeA: 1});
        expect(x).toBe(4);
    });

    it("unmounts all child components when a parent component gets unmounted", () => {
        let child;
        let GrandChild = class extends Component {};

        let Child = class extends Component {
            static el() {
                return '<div><@children/></div>';
            }

            render() {
                return {
                    children: [0, 1].map((i) => create(GrandChild))
                };
            }
        };

        let Parent = class extends Component {
            render() {
                return create(Child, {ref: (c) => child = c});
            }
        };

        render(create(Parent, {}), doc);
        expect(child.getRootEl().parentNode).toBe(doc);

        unmount(doc);
        expect(child.getRootEl().parentNode).toBe(null);
    });

    it("can retrieve element refrences with `getEl`", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <span @compA name="compA-1"></span>
                        <span @compB name="compB"></span>
                        <span @compA name="compA-2"></span>
                    </div>
                `;
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getEl('compA').getAttribute('name')).toBe('compA-1');
        expect(c.getEl('compB').getAttribute('name')).toBe('compB');
    });

    it("can retrieve multiple refrences with `getEls`", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <span @compA name="compA-1"></span>
                        <span @compB name="compB"></span>
                        <span @compA name="compA-2"></span>
                    </div>
                `;
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        let elements = c.getEls('compA', 'compB');
        let names = elements.map(el => el.getAttribute('name'));
        expect(names).toEqual(['compA-1', 'compA-2', 'compB']);
    });

    it("can overwrite the ref isntance with `getRef`", () => {
        let ref;

        let Child = class extends Component {
            getInitialState() {
                return {isRef: true};
            }
        };

        let Wrapper = class extends Component {
            getRef() {
                return this.childRef;
            }

            render() {
                return create(Child, {ref: (child) => this.childRef = child});
            }
        };

        let ContainerComponent = class extends Component {
            static el() {
                return `<div><@wrapper/></div>`;
            }

            render() {
                return {
                    wrapper: create(Wrapper, {ref: (wrapper) => ref = wrapper})
                };
            }
        };

        render(create(ContainerComponent, {}), doc);
        expect(ref instanceof Child).toBe(true);
        expect(ref.state.isRef).toBe(true);

        ref = null;

        let WrapperComponent = class extends Component {
            render() {
                return create(Wrapper, {ref: (wrapper) => ref = wrapper});
            }
        };

        render(create(WrapperComponent, {}), doc);
        expect(ref instanceof Child).toBe(true);
        expect(ref.state.isRef).toBe(true);
    });

    it("allows for having multiple instances of the same element/container", () => {
        let Child = class extends Component {
            static el() {
                return `<div></div>`;
            }

            render({propB}) {
                return {
                    root: {
                        text: propB
                    }
                };
            }
        };

        let Parent = class extends Component {
            static el() {
                return `
                    <div>
                        <@container/>
                        <span @element></span>
                        <@container/>
                        <div @element></div>
                    </div>
                `;
            }

            render(props) {
                return {
                    element: {
                        text: props.propA
                    },
                    container: create(Child, props)
                };
            }
        };

        render(create(Parent, {propA: 'valueA', propB: 'valueB'}), doc);
        expect(doc.firstChild.innerHTML.trim()).toBe(
            '<!--container-->' +
            '<div>valueB</div><span>valueA</span>' +
            '<!--container-->' +
            '<div>valueB</div><div>valueA</div>'
        );
    });

    it("does not recycle element objects by default", () => {
        let C = class extends Component {
            static el() {
                return '<div><@elementA/></div>';
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            if (!el.recycled) {
                                el.recycled = true;
                            } else {
                                incX();
                            }
                        }
                    },
                    elementA: {
                        didMount(el) {
                            if (!el.recycled) {
                                el.recycled = true;
                            } else {
                                incY();
                            }
                        }
                    }
                };
            }
        };

        render(create(C, {}), doc);
        expect(x).toBe(0);
        expect(y).toBe(0);
        render(create(C, {}), doc);
        expect(x).toBe(0);
        expect(y).toBe(0);
    });

    it("allows for the recycling of element objects", () => {
        let C = class extends Component {
            static enableElementRecycling() {
                return true;
            }

            static el() {
                return '<div><span @elementA></span></div>';
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            if (!el.recycled) {
                                el.recycled = true;
                            } else {
                                incX();
                            }
                        }
                    },
                    elementA: {
                        didMount(el) {
                            if (!el.recycled) {
                                el.recycled = true;
                            } else {
                                incY();
                            }
                        }
                    }
                };
            }
        };

        render(create(C, {}), doc);
        expect(x).toBe(0);
        expect(y).toBe(0);
        unmount(doc);
        render(create(C, {}), doc);
        expect(x).toBe(1);
        expect(y).toBe(1);
    });

    it("strips out whitespace new line text nodes between nodes", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <span> </span>    <span>   </span><span>
                            </span>
                                </div>
                `;
            }
        };

        render(create(C, {}), doc);
        let el = doc.firstChild;
        expect(el.childNodes.length).toBe(4);
        expect(el.childNodes[0].nodeType).toBe(1);
        expect(el.childNodes[1].nodeType).toBe(3);
        expect(el.childNodes[2].nodeType).toBe(1);
        expect(el.childNodes[3].nodeType).toBe(1);
    });

    it("does not strip out whitespaces within <pre></pre>", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <pre>

                        whitespace

                            <span>
                               white     spaces
                               </span>
                               </pre>
                    </div>
                `;
            }
        };

        render(create(C, {}), doc);
        let el = doc.firstChild;
        expect(el.innerHTML.replace(/\n/g, '[]').replace(/\s/g, '.')).toBe(
            '<pre>[]........................whitespace[][]............................<span>' +
            '[]...............................white.....spaces[]............................' +
            '...</span>[]...............................</pre>'
        );
    });

    /*
    it("does not allow for multiple root node templates", () => {
        let C = class extends Component {
            el: `<div></div><div></div>`
        };

        expect(() => render(create(C, {}), doc)).toThrow(
            new Error("Anvoy: can't have multiple root nodes in the template")
        );
    });
     */
});

describe("text behaviors:", () => {
    it("can mark text nodes in the template", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        Hello, {@nameA}, and {@nameB}. GoodBye {@nameA} {@nameB}.
                    </div>
                `;
            }
            render({nameA, nameB}) {
                return {
                    nameA,
                    nameB
                };
            }
        };

        render(create(C, {nameA: 'Charlie', nameB: 'Jane'}), doc);
        expect(doc.textContent.trim()).toBe('Hello, Charlie, and Jane. GoodBye Charlie Jane.');
        render(create(C, {nameA: 'Amy', nameB: 'Sam'}), doc);
        expect(doc.textContent.trim()).toBe('Hello, Amy, and Sam. GoodBye Amy Sam.');
    });

    it("can have text nodes and containers on the same level", () => {
        let Child = class extends Component {
            static el() {
                return `<div></div>`;
            }
            render(props) {
                return {
                    root: {
                        text: props.name
                    }
                };
            }
        };

        let Parent = class extends Component {
            static el() {
                return `
                    <div>
                        Hello, {@nameA}, and <@nameB/>.
                    </div>
                `;
            }
            render({nameA, nameB}) {
                return {
                    nameA,
                    nameB: create(Child, {name: nameB})
                };
            }
        };

        render(create(Parent, {nameA: 'Charlie', nameB: 'Jane'}), doc);
        expect(doc.textContent.trim()).toBe('Hello, Charlie, and Jane.');
    });
});

describe("element behaviors:", () => {
    it("registers el events", () => {
        let results = [];
        let c;

        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <span @elementA name="elementA">
                            <span @elementB name="elementB"></span>
                        </span>
                    </div>
                `;
            }

            render() {
                return {
                    root: {
                        onDoubleClick(el, e) {
                            expect(this).toBe(c);
                            results.push('root');
                        },
                        onClick(el, e) {
                            expect(this).toBe(c);
                            results.push('root');
                        }
                    },
                    elementA: {
                        onClick() {
                            expect(this).toBe(c);
                            results.push('elementA');
                        }
                    },
                    elementB: {
                        onDoubleClick() {
                            expect(this).toBe(c);
                            results.push('elementB');
                        },
                        onClick() {
                            expect(this).toBe(c);
                            results.push('elementB');
                        }
                    }
                };
            }
        };

        render(create(C, {ref: (comp) => c = comp}), doc);
        document.body.appendChild(doc);

        let root = c.getRootEl();
        let elementB = root.querySelector('[name="elementB"]');
        triggerDomEvent(elementB, 'click');
        triggerDomEvent(elementB, 'dblclick');
        let elementA = root.querySelector('[name="elementA"]');
        triggerDomEvent(elementA, 'click');
        expect(results).toEqual([
            'elementB', 'elementA', 'root', 'elementB', 'root', 'elementA', 'root'
        ]);

        document.body.innerHTML = '';
    });

    it("can create a 'td' node", () => {
        let C = class extends Component {
            static el() {
                return '<td>content</td>';
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getRootEl().outerHTML).toBe('<td>content</td>');
    });

    it("can create a 'tr' node", () => {
        let C = class extends Component {
            static el() {
                return '<tr><td>content</td></tr>';
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getRootEl().outerHTML).toBe('<tr><td>content</td></tr>');
    });

    it("can create a 'option' node", () => {
        let C = class extends Component {
            static el() {
                return '<option>content</option>';
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getRootEl().outerHTML).toBe('<option>content</option>');
    });

    it("can create a 'thead' node", () => {
        let C = class extends Component {
            static el() {
                return '<thead></thead>';
            }
        };
        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getRootEl().outerHTML).toBe('<thead></thead>');
    });

    it("can create a 'col' node", () => {
        let C = class extends Component {
            static el() {
                return '<col>';
            }
        };

        let c;
        render(create(C, {ref: (comp) => c = comp}), doc);
        expect(c.getRootEl().outerHTML).toBe('<col>');
    });

    it("can provide custom methods", () => {
        let C = class extends Component {
            static el() {
                return '<div></div>';
            }

            static elements() {
                return [
                    {
                        root: {
                            methods: {
                                myText(el, value) {
                                    el.textContent = 'my ' + value;
                                },
                                myAttr(el, value) {
                                    el.setAttribute('name', 'not my ' + value);
                                }
                            }
                        }
                    }, {
                        root: {
                            methods: {
                                myAttr(el, value) {
                                    el.setAttribute('name', 'my ' + value);
                                }
                            }
                        }
                    }
                ];
            }


            render({value}) {
                return {
                    root: {
                        myText: value,
                        myAttr: value
                    }
                };
            }
        };

        render(create(C, {value: 'valueA'}), doc);
        expect(doc.innerHTML).toBe('<div name="my valueA">my valueA</div>');
        render(create(C, {value: 'valueB'}), doc);
        expect(doc.innerHTML).toBe('<div name="my valueB">my valueB</div>');
    });

    it("shows a warning if provided an invalid element property", () => {
        let C = class extends Component {
            static el() {
                return '<div></div>';
            }

            static elements() {
                return {
                    root: {
                        invalid: true
                    }
                };
            }
        };

        spyOn(console, 'warn');
        render(create(C, {}), doc);
        expect(console.warn).toHaveBeenCalledWith(
            "Anvoy: Unknown property in element behavior: 'invalid'."
        );
    });

    it("accepts element behaviors as an elements property", () => {
        let C = class extends Component {
            static el() {
                return '<div></div>';
            }
        };

        C.elements = {
            root: {
                didMount() {
                    incX();
                }
            }
        };

        render(create(C, {}), doc);
        expect(x).toBe(1);
    });
});

describe("wrapper behaviors:", () => {
    it("can provide a description function", () => {
        let Child = class extends Component {
            static elements() {
                return {
                    root: {
                        didMount(el) {
                            el.setAttribute('id', incX());
                        }
                    }
                };
            }

            static el() {
                return `<div></div>`;
            }

            render(props) {
                return {
                    root: {
                        text: props.prop
                    }
                };
            }
        };

        let C = class extends Component {
            render({prop}) {
                return create(Child, {prop});
            }
        };

        render(create(C, {prop: 'a'}), doc);
        expect(doc.innerHTML).toBe('<div id="1">a</div>');
    });

    it("uses a comment placeholder", () => {
        let Wrapper = class extends Component {
            render() {
                return null;
            }
        };

        render(create(Wrapper, {}), doc);
        expect(doc.childNodes.length).toBe(1);
        expect(doc.childNodes[0].nodeType).toBe(8);
    });

    it("will remove contained component from the DOM when a wrapper is removed", () => {
        let Child = class extends Component {
            static el() {
                return '<div id="child"></div>';
            }
        };

        let Wrapper = class extends Component {
            render() {
                return create(Child);
            }
        };

        render(create(Wrapper, {}), doc);
        document.body.appendChild(doc);
        expect(document.getElementById('child')).not.toBeNull();
        unmount(doc);
        expect(document.getElementById('child')).toBeNull();
        expect(doc.childNodes.length).toBe(0);
    });
});

describe("container behaviors:", () => {
    it("uses a comment placeholder", () => {
        let C = class extends Component {
            static el() {
                return '<div><@container/></div>';
            }

            render() {
                return {
                    container: null
                };
            }
        };

        render(create(C, {}), doc);
        expect(doc.childNodes.length).toBe(1);
        expect(doc.childNodes[0].childNodes.length).toBe(1);
        expect(doc.childNodes[0].childNodes[0].nodeType).toBe(8);
    });

    it("can provide a description function", () => {
        let Child = class extends Component {
            static elements() {
                return {
                    root: {
                        didMount(el) {
                            el.setAttribute('id', incX());
                        }
                    }
                };
            }

            static el() {
                return `<div></div>`;
            }

            render(props) {
                return {
                    root: {
                        text: props.prop
                    }
                };
            }
        };

        let C = class extends Component {
            static el() {
                return `<div><@wrapperA/><span>-</span><@wrapperB/></div>`;
            }

            render({propsA, propsB}) {
                return {
                    wrapperA: propsA.map((prop) => create(Child, {prop})),
                    wrapperB: propsB.map((prop) => create(Child, {prop}))
                };
            }
        };

        render(create(C, {propsA: ['01', '02', '03'], propsB: ['04', '05', '06']}), doc);
        expect(doc.textContent).toBe('010203-040506');

        render(create(C, {
            propsA: ['01', '02', '03', '09', '10'],
            propsB: ['04', '05', '06', '07', '08']
        }), doc);

        expect(doc.textContent).toBe('0102030910-0405060708');

        render(create(C, {
            propsA: ['01', '02'],
            propsB: ['04', '05', '06', '07', '08', '09', '10']
        }), doc);

        expect(doc.textContent).toBe('0102-04050607080910');

        render(create(C, {propsA: [], propsB: ['01']}), doc);
        expect(doc.textContent).toBe('-01');

        render(create(C, {propsA: ['01', '02', '03'], propsB: []}), doc);
        expect(doc.textContent).toBe('010203-');
    });

    it("can provide a child function with key", () => {
        let Child = class extends Component {
            static el() {
                return `<div></div>`;
            }
            render(props) {
                return {
                    root: {
                        text: props.prop
                    }
                };
            }
        };

        let C = class extends Component {
            static el() {
                return `<div><@wrapperA/><span>-</span><@wrapperB/></div>`;
            }
            render({propsA, propsB}) {
                return {
                    wrapperA: propsA.map((prop) => create(Child, {prop, key: prop})),
                    wrapperB: propsB.map((prop) => create(Child, {prop, key: prop}))
                };
            }
        };

        render(create(C, {propsA: ['01', '02', '03'], propsB: ['04', '05', '06']}), doc);
        expect(doc.textContent).toBe('010203-040506');

        render(create(C, {
            propsA: ['01', '02', '03', '09', '10'],
            propsB: ['04', '05', '06', '07', '08']
        }), doc);

        expect(doc.textContent).toBe('0102030910-0405060708');

        render(create(C, {
            propsA: ['09', '10', '03', '02'],
            propsB: ['04', '05', '06', '07', '08', '09', '10']
        }), doc);

        expect(doc.textContent).toBe('09100302-04050607080910');

        render(create(C, {
            propsA: ['13', '10', '03', '14', '15'],
            propsB: ['12', '06', '04', '11']
        }), doc);

        expect(doc.textContent).toBe('1310031415-12060411');

        render(create(C, {propsA: [], propsB: ['01']}), doc);

        expect(doc.textContent).toBe('-01');
    });

    it("sets the container attributes as the default props for child components", () => {
        let childA;
        let childB;

        let Child = class extends Component {
            static el() {
                return `<div></div>`;
            }
        };

        let C = class extends Component {
            static el() {
                return `<div><@container propA="valueA" propB="valueB" propC/></div>`;
            }
            render() {
                return {
                    container: [
                        create(Child, {propA: 'newValueA', ref: (c) => childA = c}),
                        create(Child, {ref: (c) => childB = c})
                    ]
                };
            }
        };

        render(create(C), doc);
        expect(childA.props).toEqual({propA: 'newValueA', propB: 'valueB', propC: ''});
        expect(childB.props).toEqual({propA: 'valueA', propB: 'valueB', propC: ''});
    });
});
