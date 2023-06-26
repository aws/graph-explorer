import { canUseDOM as canUseDOMFlag } from 'exenv';
export var STATUS = {
    FAILED: 'failed',
    LOADED: 'loaded',
    LOADING: 'loading',
    PENDING: 'pending',
    READY: 'ready',
    UNSUPPORTED: 'unsupported',
};
export function canUseDOM() {
    return canUseDOMFlag;
}
export function isSupportedEnvironment() {
    return supportsInlineSVG() && typeof window !== 'undefined' && window !== null;
}
export function supportsInlineSVG() {
    /* istanbul ignore next */
    if (!document) {
        return false;
    }
    var div = document.createElement('div');
    div.innerHTML = '<svg />';
    return !!div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
}
export function randomString(length) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    var numbers = '1234567890';
    var charset = "" + letters + letters.toUpperCase() + numbers;
    var randomCharacter = function (character) {
        return character[Math.floor(Math.random() * character.length)];
    };
    var R = '';
    for (var i = 0; i < length; i++) {
        R += randomCharacter(charset);
    }
    return R;
}
/**
 *  Remove properties from an object
 */
export function removeProperties(input) {
    var filter = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        filter[_i - 1] = arguments[_i];
    }
    var output = {};
    for (var key in input) {
        /* istanbul ignore else */
        if ({}.hasOwnProperty.call(input, key)) {
            if (!filter.includes(key)) {
                output[key] = input[key];
            }
        }
    }
    return output;
}
//# sourceMappingURL=helpers.js.map