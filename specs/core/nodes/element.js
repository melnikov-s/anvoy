import Element from '../../../src/core/nodes/element';
import Component from '../../../src/core/component';
import {x, incX, y, incY} from '../../utils/counters';
import triggerDomEvent from '../../utils/triggerDomEvent';

describe("Element: ", () => {
    let div;
    let input;
    let checkbox;
    let img;
    let option;
    let src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";

    function createElement(el) {
        let component = new Component({});
        let element;

        component.setNodes((component) => {
            element = new Element(el, component);
            return element;
        });

        return element;
    }

    beforeEach(() => {
        div = document.createElement('div');
        option = document.createElement('option');
        input = document.createElement('input');
        input.type = 'text';
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        img = document.createElement('img');
    });

    describe("when pre-updating", () => {
        it("calls the willUpdate hook", () => {
            let props = {};
            let state = {};
            let prevProps = {};
            let prevState = {};
            let element = createElement(div);

            element.willUpdate = function(el, p, s, prevP, prevS) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(p).toBe(props);
                expect(s).toBe(state);
                expect(prevP).toBe(prevProps);
                expect(prevS).toBe(prevState);
                incX();
            };

            element.preUpdate(props, state, prevProps, prevState);
            expect(x).toBe(1);
        });
    });

    describe("when post-updating", () => {
        it("calls the didUpdate hook", () => {
            let props = {};
            let state = {};
            let prevProps = {};
            let prevState = {};

            let element = createElement(div);

            element.didUpdate = function(el, p, s, prevP, prevS) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(p).toBe(props);
                expect(s).toBe(state);
                expect(prevP).toBe(prevProps);
                expect(prevS).toBe(prevState);
                incX();
            };

            element.postUpdate(props, state, prevProps, prevState);
            expect(x).toBe(1);
        });
    });

    describe("when updating from a description", () => {
        it("uses custom methods if avaiable", () => {
            let component = new Component();
            let TestElement = class extends Element {};
            TestElement.methods = {
                myMethod(el, value, hasMounted) {
                    expect(hasMounted).toBe(component.hasMounted);
                    el.textContent = value;
                }
            };

            let element;

            component.setNodes((component) => {
                element = new TestElement(div, component);
                return element;
            });

            element.update({
                myMethod: 'value'
            });

            expect(element.el.textContent).toBe('value');

            component.initialize();
            component.mount();

            element.update({
                myMethod: 'valueB'
            });

            expect(element.el.textContent).toBe('valueB');
        });

        it("handles method 'text'", () => {
            let element = new Element(div);
            element.update({text: 'valueA'});
            expect(element.el.textContent).toBe('valueA');
            element.update({text: 'valueB'});
            expect(element.el.textContent).toBe('valueB');
        });

        it("handles method 'src'", () => {
            let element = new Element(img);
            element.update({src});
            expect(element.el.src).toBe(src);
        });

        it("handles method 'value'", () => {
            let element = new Element(input);
            element.update({value: 'valueA'});
            expect(element.el.value).toBe('valueA');
            element.update({value: 'valueB'});
            expect(element.el.value).toBe('valueB');
        });

        it("handles method 'checked'", () => {
            let element = new Element(checkbox);
            element.update({checked: true});
            expect(element.el.checked).toBe(true);
            expect(element.el.hasAttribute('checked')).toBe(false);
            element.update({checked: false});
            expect(element.el.checked).toBe(false);
        });

        it("handles method 'selected'", () => {
            let element = new Element(option);
            element.update({selected: true});
            expect(element.el.selected).toBe(true);
            expect(element.el.hasAttribute('selected')).toBe(false);
            element.update({selected: false});
            expect(element.el.selected).toBe(false);
        });

        it("handles method 'html'", () => {
            let element = new Element(div);
            element.update({html: '<span>valueA</span>'});
            expect(element.el.innerHTML).toBe('<span>valueA</span>');
            element.update({html: '<span>valueB</span>'});
            expect(element.el.innerHTML).toBe('<span>valueB</span>');
        });

        it("handles method 'hidden'", () => {
            let element = new Element(div);
            element.update({hidden: true});
            expect(element.el.hidden).toBe(true);
            element.update({hidden: false});
            expect(element.el.hidden).toBe(false);
        });

        it("handles method 'defaultValue'", () => {
            let component = new Component();
            let element;

            component.setNodes((component) => {
                element = new Element(input, component);
                return element;
            });

            element.update({defaultValue: 'valueA'});
            expect(element.el.value).toBe('valueA');

            component.initialize();
            component.mount();
            element.update({defaultValue: 'valueB'});
            expect(element.el.value).toBe('valueA');
        });

        it("handles method 'defaultChecked'", () => {
            let component = new Component();
            let element;

            component.setNodes((component) => {
                element = new Element(checkbox, component);
                return element;
            });

            element.update({defaultChecked: true});
            expect(element.el.checked).toBe(true);

            component.initialize();
            component.mount();
            element.update({defaultChecked: false});
            expect(element.el.checked).toBe(true);
        });

        it("handles method 'detached'", () => {
            let parentNode = document.createElement('div');
            let element;
            let component = new Component();

            component.setNodes((component) => {
                return new Element(parentNode, component);
            }, (component) => {
                element = new Element(div, component);
                return element;
            });

            parentNode.appendChild(element.el);
            element.update({detached: true});
            expect(element.el.parentNode).toBe(null);
            element.update({detached: false});
            expect(element.el.parentNode).toBe(parentNode);
        });

        it("throws an error if trying to detach a root element", () => {
            let parentNode = document.createElement('div');
            let element = new Element(div, null, 'root');
            parentNode.appendChild(element.el);
            expect(() => element.update({detached: true})).toThrow(
                new Error("Anvoy: Can't detach a root node.")
            );
        });

        it("handles method 'disabled'", () => {
            let element = new Element(input);
            element.update({disabled: true});
            expect(element.el.disabled).toBe(true);
            element.update({disabled: false});
            expect(element.el.disabled).toBe(false);
        });

        it("handles method 'classNames'", () => {
            let element = new Element(div);
            element.update({classNames: {classA: true, classB: true}});
            expect(element.el.className).toBe('classA classB');
            element.update({classNames: {classA: false, classB: true}});
            expect(element.el.className).toBe('classB');
            element.update({classNames: {classA: false, classB: false}});
            expect(element.el.className).toBe('');
        });

        it("handles method 'classNames' along with 'class' attribute", () => {
            let element = new Element(div);
            element.update({classNames: {classA: true}, "class": 'classB'});
            expect(element.el.className).toBe('classB classA');
        });

        it("handles method attributes", () => {
            let element = new Element(div);
            element.update({attrA: 'A', attrB: true});
            expect(element.el.getAttribute('attrA')).toBe('A');
            expect(element.el.hasAttribute('attrB')).toBe(true);
            expect(element.el.getAttribute('attrB')).toBe('');
            element.update({attrA: 'B', attrB: false});
            expect(element.el.getAttribute('attrA')).toBe('B');
            expect(element.el.hasAttribute('attrB')).toBe(false);
        });

        it("handles method 'styles'", () => {
            let element = new Element(div);
            element.update({styles: {color: 'red', backgroundColor: 'blue'}});
            expect(element.el.getAttribute('style')).toBe('color: red; background-color: blue;');
        });

        it("handles method 'styles' along with 'style' attribute", () => {
            let element = new Element(div);
            element.update({styles: {backgroundColor: 'red'}, style: 'color: blue;'});
            expect(element.el.getAttribute('style')).toBe('color: blue; background-color: red;');
        });

        it("subscribes to DOM element events", () => {
            let parentNode = document.createElement('div');
            let fnA = function(el, e) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(e.target).toBe(element.el);
                incX();
            };

            let fnB = function(el, e) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(e.target).toBe(element.el);
                incY();
            };

            let component = new Component();
            let element = new Element(div, component);
            parentNode.appendChild(element.el);

            element.update({
                onClick: fnA
            });

            triggerDomEvent(element.el, 'click');
            expect(x).toBe(0);

            element.mount();

            triggerDomEvent(element.el, 'click');
            expect(x).toBe(1);

            element.update({
                onClick: fnB
            });

            element.mount();
            triggerDomEvent(element.el, 'click');
            expect(x).toBe(1);
            expect(y).toBe(1);
        });

        it("subscribes to DOM element events on detached elements", () => {
            let parentNode = document.createElement('div');
            let element;
            let component = new Component();

            component.setNodes((component) => {
                return new Element(parentNode, component);
            }, (component) => {
                element = new Element(div, component);
                return element;
            });

            parentNode.appendChild(element.el);

            element.update({detached: true, onClick: incX});

            component.initialize();
            component.mount();
            element.update({detached: false, onClick: incX});
            triggerDomEvent(element.el, 'click');
            expect(x).toBe(1);
        });

        it("subscribes to custom DOM element events using 'events'", () => {
            let parentNode = document.createElement('div');
            let fnA = function(el, e) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(e.target).toBe(element.el);
                incX();
            };

            let fnB = function(el, e) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                expect(e.target).toBe(element.el);
                incY();
            };

            let component = new Component();
            let element = new Element(div, component);
            parentNode.appendChild(element.el);

            element.update({
                events: {
                    custom: fnA
                }
            });

            triggerDomEvent(element.el, 'custom');
            expect(x).toBe(0);

            element.mount();

            triggerDomEvent(element.el, 'custom');
            expect(x).toBe(1);

            element.update({
                events: {
                    custom: fnB
                }
            });

            element.mount();
            triggerDomEvent(element.el, 'custom');
            expect(x).toBe(1);
            expect(y).toBe(1);
        });
    });

    describe("when mounting", () => {
        it("calls the didMount method", () => {
            let element = createElement(div);
            element.didMount = function(el) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                incX();
            };

            element.mount();
            expect(x).toBe(1);
        });
    });

    describe("when unmounted", () => {
        it("calls the 'willUnmount' hook", () => {
            let element = createElement(div);
            element.willUnmount = function(el) {
                expect(this).toBe(element.component.behaviors);
                expect(el).toBe(element.el);
                incX();
            };

            element.unmount();
            expect(x).toBe(1);
        });
    });

    describe("when attached/detached", () => {
        it("will detach the element from it's parent", () => {
            let element = createElement(div);
            let el = element.el;
            let doc = document.createDocumentFragment();
            doc.appendChild(el);
            expect(el.parentNode).toBe(doc);
            element.detach();
            expect(el.parentNode).toBe(null);
            expect(doc.firstChild.nodeType).toBe(8);
        });

        it("will attach the element to its original parent", () => {
            let element = createElement(div);
            let el = element.el;
            let doc = document.createDocumentFragment();
            doc.appendChild(el);
            element.detach();
            expect(el.parentNode).toBe(null);
            element.attach();
            expect(el.parentNode).toBe(doc);
            expect(doc.childNodes.length).toBe(1);
        });

        it("should not throw attaching an already attached element", () => {
            let element = createElement(div);
            let el = element.el;
            let doc = document.createDocumentFragment();
            doc.appendChild(el);
            expect(() => element.attach()).not.toThrow();
        });

        it("should not throw detaching an already detached element", () => {
            let element = createElement(div);
            let el = element.el;
            let doc = document.createDocumentFragment();
            doc.appendChild(el);
            element.detach();
            expect(() => element.detach()).not.toThrow();
        });
    });
});
