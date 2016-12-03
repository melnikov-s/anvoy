export function debounceUntilNewFrame(fn) {
    let args;
    let context;
    let ran = false;

    return function() {
        args = arguments;
        context = this;

        if (!ran) {
            ran = true;
            (window.requestAnimationFrame || window.setTimeout)(() => {
                fn.apply(context, args);
                context = args = null;
                ran = false;
            }, 0);
        }
    };
}

function formatMsg(msg) {
    return `Anvoy: ${msg.charAt(0).toUpperCase() + msg.slice(1)}.`;
}

export function error(msg) {
    throw new Error(formatMsg(msg));
}

export function warn(msg) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(formatMsg(msg));
    }
}

export function extend(obj) {
    if (!obj) return obj;
    for (let i = 1, l = arguments.length; i < l; i++) {
        const source = arguments[i];
        const keys = Object.keys(source || {});

        for (let j = 0, ll = keys.length; j < ll; j++) {
            obj[keys[j]] = source[keys[j]];
        }
    }

    return obj;
}

export function flatten(arr) {
    if (!Array.isArray(arr)) return [arr];

    const flat = [];

    for (let i = 0, l = arr.length; i < l; i++) {
        if (Array.isArray(arr[i])) {
            const innerArr = flatten(arr[i]);
            flat.push(...innerArr);
        } else {
            flat.push(arr[i]);
        }
    }

    return flat;
}

let curId = 1;

export function uniqueId() {
    return '.' + curId++;
}

export function sequence(...fns) {
    if (fns.length === 1) return fns[0];

    return function() {
        for (let fn of fns) {
            fn.apply(this, arguments);
        }
    };
}
