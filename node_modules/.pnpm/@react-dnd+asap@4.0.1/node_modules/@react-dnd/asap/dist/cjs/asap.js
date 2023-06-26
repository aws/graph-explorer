"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.asap = asap;
var _asapQueueJs = require("./AsapQueue.js");
var _taskFactoryJs = require("./TaskFactory.js");
const asapQueue = new _asapQueueJs.AsapQueue();
const taskFactory = new _taskFactoryJs.TaskFactory(asapQueue.registerPendingError);
function asap(task) {
    asapQueue.enqueueTask(taskFactory.create(task));
}

//# sourceMappingURL=asap.js.map