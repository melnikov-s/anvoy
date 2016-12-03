import {setPaths, clearPaths} from './resolve';
import {GLOBAL_VAR, ATTR_MARKER} from './renderToString';

export default function(id, description) {
    let {type: Component, props, create: createComponent} = description;
    let treeRoot = document.querySelector(`[${ATTR_MARKER}="${id}"]`);
    let paths = window[GLOBAL_VAR][id];
    setPaths(paths, treeRoot);
    let component = createComponent(Component, props);
    component.initialize();
    let mountPoint = treeRoot.parentNode;
    if (mountPoint) {
        mountPoint.__anvoyComponent = component;
    }
    clearPaths();

    component.mount();

    return component;
}
