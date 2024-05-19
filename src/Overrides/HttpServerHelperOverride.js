"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServerHelperOverride = void 0;
const CoopConfig_1 = require("./../CoopConfig");
class HttpServerHelperOverride {
    container;
    httpServerHelper;
    constructor(container) {
        this.container = container;
        this.httpServerHelper = container.resolve("HttpServerHelper");
    }
    getWebsocketUrl() {
        const originalUrl = this.httpServerHelper.buildUrl();
        console.log(`Original Message WS Url is ${originalUrl}`);
        if (CoopConfig_1.CoopConfig.Instance.useMessageWSUrlOverride) {
            console.log(`Override Message WS Url to ${CoopConfig_1.CoopConfig.Instance.messageWSUrlOverride}`);
            return `ws://${CoopConfig_1.CoopConfig.Instance.messageWSUrlOverride}`;
        }
        else {
            return `ws://${originalUrl}`;
        }
    }
    override() {
        this.container.afterResolution("HttpServerHelper", (_t, result) => {
            // We want to replace the original method logic with something different
            result.getWebsocketUrl = () => {
                return this.getWebsocketUrl();
            };
            // The modifier Always makes sure this replacement method is ALWAYS replaced
        }, { frequency: "Always" });
    }
}
exports.HttpServerHelperOverride = HttpServerHelperOverride;
//# sourceMappingURL=HttpServerHelperOverride.js.map