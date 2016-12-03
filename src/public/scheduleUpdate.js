import {scheduleUpdate} from '../core/scheduler';
import {getCoreInstance} from './component';

export default function(component) {
    return scheduleUpdate(getCoreInstance(component));
}
