import {Component, render, unmount, create, scheduleUpdate} from '../../src/index';
import {x, incX} from '../utils/counters';

let doc;

beforeEach(() => {
    doc = document.createElement('div');
});

describe("scheduleUpdate:", () => {
    it("delays didMount hooks until the end of an update", () => {
        let run = 'A';
        let runs = [];

        let checkRuns = function() {
            if (run === 'A') {
                expect(runs).toEqual(['A', 'A', 'A', 'A']);
            } else {
                expect(runs).toEqual(['B', 'B', 'B']);
            }
            incX();
        };

        let GrandChild = class extends Component {
            constructor() {
                super(...arguments);
                runs.push(run);
            }

            static el() {
                return `<span></span>`;
            }

            static elements() {
                return {
                    root: {
                        didMount(el) {
                            checkRuns();
                        }
                    }
                };
            }
        };

        let Child = class extends Component {
            didMount() {
                checkRuns();
            }
            render() {
                return create(GrandChild);
            }
        };

        let Parent = class extends Component {
            static el() {
                return `<div><@children/></div>`;
            }
            render(props) {
                return {
                    children: [
                        create(Child, {key: 'a' + run}),
                        create(Child, {key: 'b' + run}),
                        create(Child, {key: 'c'}),
                        create(Child, {key: 'd' + run})
                    ]
                };
            }
        };

        render(create(Parent, {}), doc);
        expect(x).toBe(8);
        runs = [];
        run = 'B';
        render(create(Parent, {}), doc);
        expect(x).toBe(14);
    });

    it("should always update in the correct order with `scheduleUpdate`", () => {
        let results = [];

        let GrandChildA = class extends Component {
            willUpdate() {
                results.push('GrandChildA');
            }
            didMount() {
                results.push('didMountGrandChildA');
                scheduleUpdate(this);
            }
        };

        let GrandChildB = class extends Component {
            willUpdate() {
                results.push('GrandChildB');
            }
            didMount() {
                results.push('didMountGrandChildB');
                scheduleUpdate(this);
            }
        };

        let ChildA = class extends Component {
            static el() {
                return `<div><@grandChildA/></div>`;
            }

            shouldUpdate() {
                return false;
            }

            render() {
                results.push('ChildA');
                return {
                    grandChildA: create(GrandChildA)
                };
            }
        };

        let ChildB = class extends Component {
            shouldUpdate() {
                return false;
            }
            render() {
                results.push('ChildB');
                return create(GrandChildB);
            }
        };

        let Root = class extends Component {
            static el() {
                return `<div><div @wrapper><@childA/><@childB/></div></div>`;
            }

            static elements() {
                return {
                    root: {
                        willUpdate() {
                            results.push('@root');
                        }
                    },
                    wrapper: {
                        willUpdate() {
                            results.push('@wrapper');
                        }
                    }
                };
            }

            render() {
                return {
                    childA: create(ChildA),
                    childB: create(ChildB)
                };
            }
        };

        render(create(Root, {}), doc);
        expect(results).toEqual(['ChildA', 'ChildB', 'didMountGrandChildA', 'didMountGrandChildB']);
        results = [];
        render(create(Root, {}), doc);
        expect(results).toEqual(['@wrapper', '@root', 'GrandChildA', 'GrandChildB']);
    });

    it("does not update with `scheduleUpdate` components that are unmounted", () => {
        let Root = class extends Component {
            willUpdate() {
                incX();
            }
        };

        let c;
        render(create(Root, {ref: (comp) => c = comp}), doc);
        scheduleUpdate(c);
        jasmine.clock().tick(1);
        expect(x).toBe(1);

        scheduleUpdate(c);
        unmount(doc);
        jasmine.clock().tick(1);
        expect(x).toBe(1);
    });
});
