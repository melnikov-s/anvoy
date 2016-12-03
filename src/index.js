import {setDocument} from './dom';
import Component from './public/component';
import unmount from './public/unmount';
import render from './public/render';
import create from './public/create';
import clone from './public/clone';
import renderToString from './ssr/renderToString';
import hydrate from './ssr/hydrate';
import * as utils from './utils';
import scheduleUpdate from './public/scheduleUpdate';

export {
    Component,
    utils,
    scheduleUpdate,
    setDocument,
    render,
    unmount,
    clone,
    create,
    renderToString,
    hydrate
};
