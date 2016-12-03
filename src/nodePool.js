let elPool = {};

export function getFromPool(id) {
    let pool = elPool[id];
    if (pool) {
        return pool.pop();
    }
};

export function returnToPool(id, item) {
    let pool = elPool[id];
    if (!elPool[id]) {
        pool = elPool[id] = [];
    }

    pool.push(item);
}
