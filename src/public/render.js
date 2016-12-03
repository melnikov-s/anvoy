import $ from '../dom';
import unmount from './unmount';
import {getCoreInstance} from './component';

export default function({
    type: Component,
    props,
    key = null,
    ref
}, mountPoint) {
    let prevComp = mountPoint.__anvoyComponent;
    let prevCoreComp;
    if (prevComp) {
        prevCoreComp = getCoreInstance(prevComp);
    }

    if (
        prevCoreComp && prevCoreComp.instanceOfCheck(Component) &&
        ((key == null && prevCoreComp.key == null) || key === prevCoreComp.key)
    ) {
        prevCoreComp.replaceProps(props);
        if (ref) ref(prevCoreComp.getRef());
    } else {
        unmount(mountPoint);
        mountPoint.innerHTML = '';
        let publicComponent = new Component(props);
        let coreComponent = getCoreInstance(publicComponent);
        if (key != null) coreComponent.key = key;
        coreComponent.initialize();
        if (ref) ref(coreComponent.getRef());
        $.append(coreComponent.rootNode.el, mountPoint);
        mountPoint.__anvoyComponent = publicComponent;
        coreComponent.mount();
    }
}
