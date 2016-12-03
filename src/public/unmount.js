import $ from '../dom';

export default function(mountPoint) {
    if (mountPoint.__anvoyComponent) {
        let component = mountPoint.__anvoyComponent.__coreInstance;
        component.unmount();
        $.remove(component.rootNode.el);
        mountPoint.__anvoyComponent = null;
    }
}
