"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoopConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CoopConfig {
    webSocketPort;
    natHelperPort;
    useUPNP;
    useMessageWSUrlOverride;
    messageWSUrlOverride;
    static Instance;
    constructor() {
        this.webSocketPort = 6970;
        this.natHelperPort = 6971;
        this.useUPNP = true;
        this.useMessageWSUrlOverride = false;
        this.messageWSUrlOverride = '127.0.0.1:6969';
        const configFilePath = path_1.default.join(__dirname, "..", "config");
        if (!fs_1.default.existsSync(configFilePath))
            fs_1.default.mkdirSync(configFilePath, { recursive: true });
        console.log(`COOP MOD: Coop Config Loading >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
        var coopConfigFilePath = path_1.default.join(configFilePath, "coopConfig.json");
        // console.log(coopConfigFilePath);
        if (!fs_1.default.existsSync(coopConfigFilePath)) {
            console.warn(`Coop Config doesn't exist, creating default config.`);
            //console.warn(`BE AWARE! ExternalIPFinder is ACTIVE! The externalIP config value is ignored!`);
            const coopcfgString = JSON.stringify(this, null, 4);
            fs_1.default.writeFileSync(coopConfigFilePath, coopcfgString);
        }
        else {
            Object.assign(this, JSON.parse(fs_1.default.readFileSync(coopConfigFilePath).toString()));
            console.log(`COOP MOD: Coop Config loaded.`);
            /*
            if(this.useExternalIPFinder) {
                console.log(`COOP MOD: BE AWARE! ExternalIPFinder is ACTIVE!`);
            }
            */
        }
        // console.log(this);
        CoopConfig.Instance = this;
    }
}
exports.CoopConfig = CoopConfig;
//# sourceMappingURL=CoopConfig.js.map