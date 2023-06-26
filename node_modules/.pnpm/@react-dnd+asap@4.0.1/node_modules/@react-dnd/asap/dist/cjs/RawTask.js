"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
class RawTask {
    call() {
        try {
            this.task && this.task();
        } catch (error) {
            this.onError(error);
        } finally{
            this.task = null;
            this.release(this);
        }
    }
    constructor(onError, release){
        this.onError = onError;
        this.release = release;
        this.task = null;
    }
}
exports.RawTask = RawTask;

//# sourceMappingURL=RawTask.js.map