export let x = 0;
export let y = 0;
export let z = 0;
export let w = 0;
export let incX = function() {
    return ++x;
};

export let incY = function() {
    return ++y;
};

export let incZ = function() {
    return ++z;
};

export let incW = function() {
    return ++w;
};

beforeEach(function() {
    x = 0;
    y = 0;
    z = 0;
    w = 0;
});
