import {clearAll} from '../src/core/scheduler';

//required to fallback to setTimeout during tests
window.requestAnimationFrame = false;

beforeEach(function() {
    jasmine.clock().install();
});

afterEach(function() {
    clearAll();
    jasmine.clock().tick(100);
    jasmine.clock().uninstall();
});
