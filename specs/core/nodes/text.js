import Text from '../../../src/core/nodes/text';

describe("Element: ", () => {
    describe("when updated", () => {
        it("updates the text node", () => {
            let text = new Text(document.createTextNode(''));
            text.update('value');
            expect(text.el.nodeValue).toBe('value');
        });

        it("defaults to an empty string if the value is undefined", () => {
            let text = new Text(document.createTextNode('value'));
            text.update();
            expect(text.el.nodeValue).toBe('');
        });
    });
});
