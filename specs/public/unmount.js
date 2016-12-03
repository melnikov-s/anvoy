import {Component, render, unmount, create} from '../../src/index';

let doc;

beforeEach(() => {
    doc = document.createElement('div');
});

describe("unmount:", () => {
    it("unmounts a component", () => {
        let CompA = class extends Component {
            static el() {
                return `<div data-id="A"></div>`;
            }
        };

        let CompB = class extends Component {
            static el() {
                return `<div data-id="B"></div>`;
            }
        };

        render(create(CompA, {}), doc);
        expect(doc.firstChild.getAttribute('data-id')).toBe('A');

        render(create(CompB, {}), doc);
        expect(doc.firstChild.getAttribute('data-id')).toBe('B');
        expect(doc.childNodes.length).toBe(1);

        unmount(doc);
        expect(doc.childNodes.length).toBe(0);
    });
});
