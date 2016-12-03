import {extend} from '../utils';

export default function(description, props = {}) {
    let finalProps = extend({}, description.props);
    let key = description.key;
    let ref = description.ref;

    for (let prop of Object.keys(props)) {
        let value = props[prop];
        if (prop === 'key') {
            key = value;
        } else if (prop === 'ref') {
            ref = value;
        } else {
            finalProps[prop] = value;
        }
    }

    return {
        create: description.create,
        type: description.type,
        props: finalProps,
        key,
        ref
    };
}
