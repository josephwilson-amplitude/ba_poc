"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChromeExtension = void 0;
var global_scope_1 = require("../global-scope");
function isChromeExtension() {
    var _a, _b;
    var globalScope = (0, global_scope_1.getGlobalScope)();
    return typeof ((_b = (_a = globalScope === null || globalScope === void 0 ? void 0 : globalScope.chrome) === null || _a === void 0 ? void 0 : _a.runtime) === null || _b === void 0 ? void 0 : _b.id) === 'string';
}
exports.isChromeExtension = isChromeExtension;
//# sourceMappingURL=environment.js.map