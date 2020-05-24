"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Returns an array of space-seperated strings in key/value pairs (as array)
function parseForPairs(environmentVariables) {
    let env = [];
    if (environmentVariables) {
        // Regex ensures that key=value pairs can have spaces in them
        let keyValuePairs = environmentVariables.match(/\w+|"[^"]+"/g);
        if (keyValuePairs === null) {
            return env;
        }
        keyValuePairs.forEach((pair) => {
            const obj = parsePair(pair);
            env.push(obj);
        });
    }
    return env;
}
exports.parseForPairs = parseForPairs;
function parsePair(pair) {
    // trim qoutes, if any
    let startIdx = 0;
    let stopIdx = pair.length;
    if (pair[0] === '"') {
        startIdx = 1;
    }
    if (pair[pair.length - 1] === '"') {
        stopIdx = stopIdx - 1;
    }
    const splitPoint = pair.indexOf("=");
    const key = pair.substring(startIdx, splitPoint);
    const value = pair.substring(splitPoint + 1, stopIdx);
    return [key, value];
}
