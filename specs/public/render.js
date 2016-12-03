import {Component, render, create} from '../../src/index';

let doc;

beforeEach(() => {
    doc = document.createElement('div');
});

describe("render:", () => {
    it("can use a 'ref' callback", () => {
        let Child = class extends Component {};
        let C = class extends Component {
            getRef() {
                return this._ref;
            }
            render() {
                return create(Child, {ref: (c) => this._ref = c});
            }
        };

        let child;
        render(create(C, {ref: (comp) => child = comp}), doc);
        expect(child instanceof Child).toBe(true);
    });

    it("mounts a component", () => {
        let CompA = class extends Component {
            static el() {
                return `<div data-id="A"></div>`;
            }
        };

        render(create(CompA, {}), doc);
        expect(doc.firstChild.getAttribute('data-id')).toBe('A');
    });

    it("updates the existing component if the same type is rendered", () => {
        let CompA = class extends Component {};

        let compA1;
        let compA2;
        render(create(CompA, {propA: 'valueA', ref: (comp) => compA1 = comp}), doc);
        render(create(CompA, {propB: 'valueB', ref: (comp) => compA2 = comp}), doc);

        expect(compA1).toBe(compA2);
        expect(compA1.props).toEqual({propB: 'valueB'});
    });

    it("updates the existing component if the same type and key is rendered", () => {
        let CompA = class extends Component {};

        let compA1;
        let compA2;

        render(create(CompA, {propA: 'valueA', key: 1, ref: (comp) => compA1 = comp}), doc);
        render(create(CompA, {propB: 'valueB', key: 1, ref: (comp => compA2 = comp)}), doc);

        expect(compA1).toBe(compA2);
        expect(compA1.props).toEqual({propB: 'valueB'});
        expect(compA1.getRootEl().parentNode).toBe(doc);
    });

    it("unmounts an existing component if a new component has a different key", () => {
        let CompA = class extends Component {};

        let compA1;
        let compA2;

        render(create(CompA, {propA: 'valueA', key: 0, ref: (comp) => compA1 = comp}), doc);
        render(create(CompA, {propB: 'valueB', key: 1, ref: (comp) => compA2 = comp}), doc);

        expect(compA1).not.toBe(compA2);
        expect(compA1.getRootEl().parentNode).toBe(null);
        expect(compA2.getRootEl().parentNode).toBe(doc);
    });

    it("unmounts an existing component if the keys match but the types do not", () => {
        let CompA = class extends Component {};
        let CompB = class extends Component {};

        let compA1;
        let compA2;

        render(create(CompA, {propA: 'valueA', key: 1, ref: (comp) => compA1 = comp}), doc);
        render(create(CompB, {propB: 'valueB', key: 1, ref: (comp) => compA2 = comp}), doc);

        expect(compA1).not.toBe(compA2);
        expect(compA1.getRootEl().parentNode).toBe(null);
        expect(compA2.getRootEl().parentNode).toBe(doc);
    });

    it("unmounts an existing component if the new component has key but the old one does not", () => {
        let CompA = class extends Component {};
        let CompB = class extends Component {};

        let compA1;
        let compA2;

        render(create(CompA, {propA: 'valueA', key: 1, ref: (comp) => compA1 = comp}), doc);
        render(create(CompB, {propB: 'valueB', ref: (comp) => compA2 = comp}), doc);

        expect(compA1).not.toBe(compA2);
        expect(compA1.getRootEl().parentNode).toBe(null);
        expect(compA2.getRootEl().parentNode).toBe(doc);
    });

    it("unmounts an existing component if the old component has key but the new one does not", () => {
        let CompA = class extends Component {};
        let CompB = class extends Component {};

        let compA1;
        let compA2;

        render(create(CompA, {propA: 'valueA', ref: (comp) => compA1 = comp}), doc);
        render(create(CompB, {propB: 'valueB', key: 1, ref: (comp) => compA2 = comp}), doc);

        expect(compA1).not.toBe(compA2);
        expect(compA1.getRootEl().parentNode).toBe(null);
        expect(compA2.getRootEl().parentNode).toBe(doc);
    });
});
