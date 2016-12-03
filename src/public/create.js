import {error} from '../utils';
import {default as Component, getCoreInstance} from './component';
import CoreComponent from '../core/component';

let rInvalidTag = /[^a-zA-Z0-9\-\_]+/;

const SELF_CLOSING_TAGS = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
};

let tagComponents = {};

function getTagComponent(tag) {
    if (tagComponents[tag]) {
        return tagComponents[tag];
    }

    if (rInvalidTag.test(tag)) {
        error(`provided an invalid tag: '${tag}' to 'create'`);
    }

    let Comp = class extends Component {
        render(props) {
            return {root: props};
        }
    };

    Comp.el = SELF_CLOSING_TAGS[tag] ? `<${tag}/>` : `<${tag}></${tag}>`;

    tagComponents[tag] = Comp;
    return Comp;
}

function createComponent({type: PublicComponent, props, eventContext}, parent) {
    let component = getCoreInstance(new PublicComponent(props, parent));
    if (eventContext) {
        component.eventContext = eventContext;
    }

    return component;
}

export default function(Type, props = {}) {
    let eventContext;

    if (typeof Type === 'string') {
        Type = getTagComponent(Type);
        eventContext = CoreComponent.currentRender && CoreComponent.currentRender.behaviors;
    }

    //We need this check because IE10 and bellow do not support inherited static props.
    let finalProps = 'getDefaultProps' in Type ? Type.getDefaultProps() : {};
    let key;
    let ref;

    for (let prop of Object.keys(props)) {
        let value = props[prop];
        if (prop === 'key') {
            key = value;
        } else if (prop === 'ref') {
            ref = value;
        } else if (value !== undefined || !(prop in finalProps)) {
            finalProps[prop] = value;
        }
    }

    return {
        create: createComponent,
        eventContext,
        type: Type,
        props: finalProps,
        key,
        ref
    };
}
