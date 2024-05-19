"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SITConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class SITConfig {
    runAzureWebAppHelper;
    openAllExfils;
    // Player Names
    showPlayerNameTags;
    showPlayerNameTagsOnlyWhenVisible;
    static Instance;
    constructor() {
        this.runAzureWebAppHelper = false;
        this.openAllExfils = false;
        this.showPlayerNameTags = false;
        this.showPlayerNameTagsOnlyWhenVisible = false;
        // console.log(`SIT Config Loading >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
        var sitConfigFilePath = path_1.default.join(__dirname, "..", "config", "SITConfig.json");
        // console.log(sitConfigFilePath);
        if (!fs_1.default.existsSync(sitConfigFilePath)) {
            const sitcfgString = JSON.stringify(this, null, 4);
            fs_1.default.writeFileSync(sitConfigFilePath, sitcfgString);
        }
        else {
            Object.assign(this, JSON.parse(fs_1.default.readFileSync(sitConfigFilePath).toString()));
            // console.log(`SIT Config loaded.`);
        }
        // console.log(this);
        SITConfig.Instance = this;
    }
    routeHandler(container) {
        const dynamicRouterModService = container.resolve("DynamicRouterModService");
        const staticRouterModService = container.resolve("StaticRouterModService");
        staticRouterModService.registerStaticRouter("MyStaticModRouterSITConfig", [
            {
                url: "/SIT/Config",
                action: (url, info, sessionId, output) => {
                    console.log(SITConfig.Instance);
                    output = JSON.stringify(SITConfig.Instance);
                    return output;
                }
            }
        ], "aki");
    }
}
exports.SITConfig = SITConfig;
//# sourceMappingURL=SITConfig.js.map