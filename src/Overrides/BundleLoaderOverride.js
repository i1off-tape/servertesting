"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleLoaderOverride = void 0;
const node_path_1 = __importDefault(require("node:path"));
const BundleLoader_1 = require("C:/snapshot/project/obj/loaders/BundleLoader");
class BundleLoaderOverride {
    container;
    jsonUtil;
    vfs;
    bundles = {};
    bundleHashCacheService;
    constructor(container) {
        this.bundleHashCacheService = container.resolve("BundleHashCacheService");
        this.container = container;
        this.vfs = container.resolve("VFS");
        this.jsonUtil = container.resolve("JsonUtil");
    }
    getBundles() {
        const result = [];
        for (const bundle in this.bundles) {
            result.push(this.getBundle(bundle));
        }
        return result;
    }
    getBundle(key) {
        //decode the bundle key name to support spaces, etc.
        return this.jsonUtil.clone(this.bundles[key]);
    }
    addBundles(modpath) {
        const bundleManifestArr = this.jsonUtil.deserialize(this.vfs.readFile(`${modpath}bundles.json`)).manifest;
        for (const bundleManifest of bundleManifestArr) {
            // return a partial url. the complete url will be build on client side.
            const absoluteModPath = node_path_1.default.join(process.cwd(), modpath).slice(0, -1).replace(/\\/g, "/");
            const bundleLocalPath = `${modpath}bundles/${bundleManifest.key}`.replace(/\\/g, "/");
            if (!this.bundleHashCacheService.calculateAndMatchHash(bundleLocalPath)) {
                this.bundleHashCacheService.calculateAndStoreHash(bundleLocalPath);
            }
            const bundleHash = this.bundleHashCacheService.getStoredValue(bundleLocalPath);
            this.addBundle(bundleManifest.key, new BundleLoader_1.BundleInfo(absoluteModPath, bundleManifest, bundleHash));
        }
    }
    addBundle(key, b) {
        this.bundles[key] = b;
    }
    override() {
        const thisObj = this;
        this.container.afterResolution("BundleLoader", (_t, result) => {
            result.addBundle = (key, b) => {
                return thisObj.addBundle(key, b);
            };
            result.addBundles = (modpath) => {
                return thisObj.addBundles(modpath);
            };
            result.getBundle = (key) => {
                return thisObj.getBundle(key);
            };
            result.getBundles = () => {
                return thisObj.getBundles();
            };
        });
    }
}
exports.BundleLoaderOverride = BundleLoaderOverride;
//# sourceMappingURL=BundleLoaderOverride.js.map