"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AsyncInstance {
    constructor($, id) {
        AsyncInstance.assertConstructable($);
        this.id = id;
    }
    ready() {
        if (this.__error__) {
            throw this.__error__;
        }
    }
    __delete__() {
        this.__error__ = new Error('This Object Has Been Deleted.');
    }
    static assertCallable($) {
        if ($ !== AsyncInstance) {
            throw new Error('Cannot Call Constructor Directly.');
        }
    }
    static assertConstructable($) {
        if ($ !== AsyncInstance) {
            throw new Error('Cannot Call Constructor Directly.');
        }
    }
}
exports.AsyncInstance = AsyncInstance;
//# sourceMappingURL=AsyncClass.js.map