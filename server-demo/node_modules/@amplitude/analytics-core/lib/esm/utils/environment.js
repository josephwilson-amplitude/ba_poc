import { getGlobalScope } from '../global-scope';
export function isChromeExtension() {
    var _a, _b;
    var globalScope = getGlobalScope();
    return typeof ((_b = (_a = globalScope === null || globalScope === void 0 ? void 0 : globalScope.chrome) === null || _a === void 0 ? void 0 : _a.runtime) === null || _b === void 0 ? void 0 : _b.id) === 'string';
}
//# sourceMappingURL=environment.js.map