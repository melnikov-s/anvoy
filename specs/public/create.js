import {Component, render, create} from '../../src/index';
import triggerDomEvent from '../utils/triggerDomEvent';

let doc;

beforeEach(() => {
    doc = document.createElement('div');
});

describe("create:", () => {
    it("returns the expected data structure", () => {
        let key = 1;
        let ref = () => {};
        let props = {prop: {}, key, ref};
        let C = class extends Component {};

        let description = create(C, props);
        expect(description.props).not.toBe(props);
        delete description.create;
        expect(description).toEqual({
            type: C,
            eventContext: undefined,
            props: {
                prop: props.prop
            },
            key,
            ref
        });
    });

    it("can create a tagged component", () => {
        let C = class extends Component {
            static el() {
                return `
                    <select>
                        <@options class="myClass"/>
                    </select>
                `;
            }

            render(props) {
                return {
                    options: props.options.map(({value, text}) => create('option', {value, text}))
                };
            }
        };

        let options = [{text: 'Option1', value: 'opt1'}, {text: 'Option2', value: 'opt2'}];

        render(create(C, {options}), doc);
        expect(doc.innerHTML).toBe(
            '<select><!--options-->' +
                '<option class="myClass" value="opt1">Option1</option>' +
                '<option class="myClass" value="opt2">Option2</option>' +
            '</select>'
        );

        options = [{text: 'New Options', value: 'newOpt'}];
        render(create(C, {options}), doc);
        expect(doc.innerHTML).toBe(
            '<select><!--options-->' +
                '<option class="myClass" value="newOpt">New Options</option>' +
            '</select>'
        );
    });

    it("can create self-closing tag components", () => {
        let C = class extends Component {
            static el() {
                return `
                    <div>
                        <@inputs />
                    </div>
                `;
            }

            render(props) {
                return {
                    inputs: props.inputs.map(({value, classNames}) => {
                        return create('input', {value, classNames});
                    })
                };
            }
        };

        let inputs = [
            {value: 'value1', classNames: {className1: true}},
            {value: 'value2', classNames: {className2: false}}
        ];

        render(create(C, {inputs}), doc);
        let el = doc.firstChild;
        expect(el.childNodes.length).toBe(3);
        expect(el.childNodes[0].nodeType).toBe(8);
        let input1 = el.childNodes[1];
        expect(input1.value).toBe('value1');
        expect(input1.className).toBe('className1');

        let input2 = el.childNodes[2];
        expect(input2.value).toBe('value2');
        expect(input2.className).toBe('');
    });

    it("sets the tag component event context to be the currently rendering component", () => {
        let results = [];
        let c;

        let C = class extends Component {
            handleInput(el) {
                expect(this).toBe(c);
                expect(this.getRootEl().tagName).toBe('DIV');
                results.push(el.value);
            }

            static el() {
                return `
                    <div>
                        <@inputs class="my-input"/>
                    </div>
                `;
            }

            render(props) {
                return {
                    inputs: props.inputs.map(({value}) => {
                        return create('input', {
                            value,
                            onChange: this.handleInput
                        });
                    })
                };
            }
        };

        let inputs = [
            {value: 'value1'},
            {value: 'value2'}
        ];

        render(create(C, {inputs, ref: (comp) => c = comp}), doc);
        let el = doc.firstChild;
        let inputEls = el.childNodes;

        for (let input of inputEls) {
            triggerDomEvent(input, 'change');
        }

        expect(results).toEqual(['value1', 'value2']);
    });

    it("throws an error if provided an invalid tag", () => {
        expect(() => create('valid-tag')).not.toThrow();
        expect(() => create('invalid tag')).toThrow(
            new Error("Anvoy: Provided an invalid tag: 'invalid tag' to 'create'.")
        );
    });

    it("can provide default props", () => {
        let C = class extends Component {
            static getDefaultProps() {
                return {propA: 'valueA', propB: 'valueB', propC: 'valueC'};
            }
        };

        let c;
        render(create(C, {propB: 'anotherValue', propC: undefined, ref: (comp) => c = comp}), doc);
        expect(c.props).toEqual({propA: 'valueA', propB: 'anotherValue', propC: 'valueC'});
    });
});
