"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class AsyncInit {
    constructor() {
        this.__init__ = {
            error: null,
            ready: false,
            waits: [],
            evict: false
        };
    }
    __finish__(res) {
        let self = this;
        self.finish(res);
        self.__init__.ready = true;
        self.__init__.waits.forEach(wait => wait.res());
        self.__init__.waits = [];
    }
    __error__(res) {
        let self = this;
        let err = new Error(res);
        self.__init__.error = err;
        self.__init__.waits.forEach(wait => wait.rej(err));
        self.__init__.waits = [];
    }
    __delete__() {
        let self = this;
        self.__init__.evict = true;
        self.__init__.error = new Error('This Tensor Has Been Deleted');
    }
    ready() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let self = this;
            if (self.__init__.error || self.__init__.evict) {
                throw self.__init__.error;
            }
            else if (self.__init__.ready) {
                return;
            }
            yield new Promise((res, rej) => {
                self.__init__.waits.push({ res, rej });
            });
        });
    }
}
exports.AsyncInit = AsyncInit;
//# sourceMappingURL=AsyncInit.js.map