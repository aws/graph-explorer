"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _rawTaskJs = require("./RawTask.js");
class TaskFactory {
    create(task) {
        const tasks = this.freeTasks;
        const t1 = tasks.length ? tasks.pop() : new _rawTaskJs.RawTask(this.onError, (t)=>tasks[tasks.length] = t
        );
        t1.task = task;
        return t1;
    }
    constructor(onError){
        this.onError = onError;
        this.freeTasks = [];
    }
}
exports.TaskFactory = TaskFactory;

//# sourceMappingURL=TaskFactory.js.map