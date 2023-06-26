"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESBuildMinifyPlugin = exports.ESBuildPlugin = void 0;
const loader_1 = __importDefault(require("./loader"));
const plugin_1 = __importDefault(require("./plugin"));
exports.ESBuildPlugin = plugin_1.default;
const minify_plugin_1 = __importDefault(require("./minify-plugin"));
exports.ESBuildMinifyPlugin = minify_plugin_1.default;
exports.default = loader_1.default;
