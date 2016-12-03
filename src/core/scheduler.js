import {debounceUntilNewFrame} from '../utils';

let scheduledUpdates = [];
let nextScheduledUpdates = [];
let mounts = [];
let isUpdating = false;
let instantMount = false;
let updatingDepth = null;

export function setInstantMount(value) {
    instantMount = value;
}

export function clearAll() {
    scheduledUpdates = [];
    mounts = [];
    nextScheduledUpdates = [];
    isUpdating = false;
}

function flushUpdates() {
    isUpdating = true;
    try {
        for (let updates of scheduledUpdates) {
            //updates is a sparse array not all entries will be defined
            if (updates) {
                for (let key of Object.keys(updates)) {
                    let component = updates[key];
                    if (component && !component.isUnmounted) {
                        component.update();
                    }
                }
            }
        }
    } finally {
        scheduledUpdates = nextScheduledUpdates;
        nextScheduledUpdates = [];
        isUpdating = false;
    }
}

export function flushChildrenUpdates(component) {
    let parentId = component.id;
    let depth = component.depth;

    isUpdating = true;

    try {
        for (let i = depth; i < scheduledUpdates.length; i++) {
            let updates = scheduledUpdates[i];
            //updates is a sparse array not all entries will be defined
            if (updates) {
                for (let id of Object.keys(updates)) {
                    let component = updates[id];
                    if (component && !component.isUnmounted && component.hierarchy[parentId]) {
                        component.update();
                        updates[id] = null;
                    }
                }
            }
        }
    } finally {
        isUpdating = false;
    }
}

function flushMounts() {
    for (let component of mounts) {
        component.mount();
    }

    mounts = [];
}


let flushUpdatesOnNewFrame = debounceUntilNewFrame(flushUpdates);

export function scheduleUpdate(component) {
    let id = component.id;
    let depth = component.depth;

    let updates = isUpdating ? nextScheduledUpdates : scheduledUpdates;

    if (!updates[depth]) updates[depth] = {};
    updates[depth][id] = component;
    flushUpdatesOnNewFrame();
}

export function addMount(component) {
    if (instantMount) {
        component.mount();
    } else {
        mounts.push(component);
    }
}

export function registerUpdateStart(component) {
    let id = component.id;
    let depth = component.depth;

    if (updatingDepth === null) {
        updatingDepth = depth;
    }

    if (scheduledUpdates[depth] && scheduledUpdates[depth][id]) {
        scheduledUpdates[depth][id] = null;
    }
}

export function registerUpdateEnd(component) {
    let depth = component.depth;

    if (updatingDepth === depth) {
        flushMounts();
        updatingDepth = null;
    }
}
