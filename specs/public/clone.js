import {Component, create, clone} from '../../src/index';


describe("clone:", () => {
    it("can override existing props", () => {
        let C = class extends Component {};
        let props = {propA: 'valueA', propB: 'valueB'};
        let description = create(C, props);
        let createFn = description.create;
        let cloned = clone(description, {propB: 'newValue'});
        expect(cloned).toEqual({
            create: createFn,
            type: C,
            props: {
                propA: 'valueA',
                propB: 'newValue'
            },
            key: undefined,
            ref: undefined
        });
    });

    it("can override 'key'", () => {
        let C = class extends Component {};
        let oldKey = 0;
        let newKey = 1;
        let props = {propA: 'valueA', key: oldKey};
        let description = create(C, props);
        let createFn = description.create;
        let cloned = clone(description, {key: newKey});
        expect(cloned).toEqual({
            create: createFn,
            type: C,
            props: {
                propA: 'valueA'
            },
            key: 1,
            ref: undefined
        });
    });

    it("can override 'ref'", () => {
        let C = class extends Component {};
        let oldRef = () => {};
        let newRef = () => {};
        let props = {propA: 'valueA', ref: oldRef};
        let description = create(C, props);
        let createFn = description.create;
        let cloned = clone(description, {ref: newRef});
        expect(cloned).toEqual({
            create: createFn,
            type: C,
            props: {
                propA: 'valueA'
            },
            key: undefined,
            ref: newRef
        });
    });
});
