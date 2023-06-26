"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const esbuild_1 = require("esbuild");
const loader_utils_1 = require("loader-utils");
const joycon_1 = __importDefault(require("joycon"));
const json5_1 = __importDefault(require("json5"));
const joycon = new joycon_1.default();
joycon.addLoader({
    test: /\.json$/,
    async load(filePath) {
        try {
            const config = fs_1.default.readFileSync(filePath, 'utf8');
            return json5_1.default.parse(config);
        }
        catch (error) {
            throw new Error(`Failed to parse tsconfig at ${path_1.default.relative(process.cwd(), filePath)}: ${error.message}`);
        }
    },
});
const isTsExtensionPtrn = /\.ts$/i;
let tsConfig;
async function ESBuildLoader(source) {
    var _a, _b, _c;
    const done = this.async();
    const options = (0, loader_utils_1.getOptions)(this);
    const { implementation, ...esbuildTransformOptions } = options;
    if (implementation && typeof implementation.transform !== 'function') {
        done(new TypeError(`esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received ${typeof implementation.transform}`));
        return;
    }
    const transform = (_a = implementation === null || implementation === void 0 ? void 0 : implementation.transform) !== null && _a !== void 0 ? _a : esbuild_1.transform;
    const transformOptions = {
        ...esbuildTransformOptions,
        target: (_b = options.target) !== null && _b !== void 0 ? _b : 'es2015',
        loader: (_c = options.loader) !== null && _c !== void 0 ? _c : 'js',
        sourcemap: this.sourceMap,
        sourcefile: this.resourcePath,
    };
    if (!('tsconfigRaw' in transformOptions)) {
        if (!tsConfig) {
            tsConfig = await joycon.load(['tsconfig.json']);
        }
        if (tsConfig.data) {
            transformOptions.tsconfigRaw = tsConfig.data;
        }
    }
    // https://github.com/privatenumber/esbuild-loader/pull/107
    if (transformOptions.loader === 'tsx'
        && isTsExtensionPtrn.test(this.resourcePath)) {
        transformOptions.loader = 'ts';
    }
    try {
        const { code, map } = await transform(source, transformOptions);
        done(null, code, map && JSON.parse(map));
    }
    catch (error) {
        done(error);
    }
}
exports.default = ESBuildLoader;
