export var omitUndefined = function (input) {
    var obj = {};
    for (var key in input) {
        var val = input[key];
        if (val) {
            obj[key] = val;
        }
    }
    return obj;
};
//# sourceMappingURL=omit-undefined.js.map