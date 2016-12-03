import $ from '../../dom';
import Node from './node';

export default class Text extends Node {
    update(value) {
        if (value == null) value = '';

        $.nodeValue(this.el, value);
    }
}
