"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function assertType(value, Type) {
    if (typeof Type == 'string') {
        if (typeof value == Type) {
            return value;
        }
        throw new TypeError(`Value Is Not Of Type: ${Type}`);
    }
    if (value instanceof Type) {
        return value;
    }
    throw new TypeError(`Value Is Not Of Type: ${Type.name}`);
}
exports.assertType = assertType;
//# sourceMappingURL=asserts.js.map