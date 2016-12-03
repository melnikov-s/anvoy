import $ from '../dom';
import {getPaths} from './resolve';

export const GLOBAL_VAR = '__ANVOY_HYDRATE_DATA__';
export const ATTR_MARKER = 'data-anvoy-hydrate-id';

export default function(id, {type: Component, props, create: createComponent}) {
    let component = createComponent(Component, props);
    component.initialize();
    let paths = [];
    let indexMap = new Map();
    getPaths(component, paths, indexMap);
    let el = component.getRootEl();
    $.setAttr(el, ATTR_MARKER, id);

    return `
        <script>
            if (typeof ${GLOBAL_VAR} === 'undefined') {
                ${GLOBAL_VAR} = {};
            }

            ${GLOBAL_VAR}["${id.replace('"', '\\"')}"] = ${JSON.stringify(paths)};
        </script>

        ${el.outerHTML}
    `;
}
