export default function triggerDomEvent(elem, event) {
    let ev = document.createEvent('Event');
    ev.initEvent(event, true, true);
    elem.dispatchEvent(ev);
}
