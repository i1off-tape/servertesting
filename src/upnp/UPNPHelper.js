"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPNPHelper = void 0;
// import { Client } from "@megachips/nat-upnp";
const CoopConfig_1 = require("../CoopConfig");
const client_1 = __importDefault(require("./upnp/client"));
class UPNPHelper {
    // client:Client; 
    coopConfig;
    akiIP;
    akiPort;
    useUPNP;
    constructor(in_akiIP, in_akiPort) {
        this.coopConfig = new CoopConfig_1.CoopConfig();
        this.akiIP = in_akiIP;
        this.akiPort = in_akiPort;
        const ttl = 30;
        // this.client = new Client({ timeout: 10 * 1000, cacheGateway: true });
        if (this.akiIP === "" || this.akiIP === "127.0.0.1") {
            return;
        }
        if (this.coopConfig.useUPNP) {
            // this.doUPNPMappingsMegachipsAxios(() => {
            this.doUPNPMappingsOwn();
            // });
        }
    }
    doUPNPMappingsOwn() {
        const client = new client_1.default({ enablePMP: true, enableUPNP: true, permanentFallback: true });
        const akiPromise = client.portMapping({ public: this.akiPort, private: this.akiPort, protocol: "TCP" });
        const sitWSPromise = client.portMapping({ public: this.coopConfig.webSocketPort, private: this.coopConfig.webSocketPort, protocol: "TCP" });
        const natPromise = client.portMapping({ public: this.coopConfig.natHelperPort, private: this.coopConfig.natHelperPort, protocol: "TCP" });
        const p2pPromise = client.portMapping({ public: 6972, private: 6972, protocol: "UDP" });
        Promise.all(new Array(akiPromise, sitWSPromise, natPromise, p2pPromise)).then((x) => {
            console.log(`SIT: UPNP: Successfully mapped ${this.akiPort},${this.coopConfig.webSocketPort},${this.coopConfig.natHelperPort},6972`);
        }).catch((rejectedReason) => {
            if (rejectedReason instanceof Error && rejectedReason.message.includes('Timeout')) {
                console.log(`SIT: UPNP: UPnP request timed out. Ignore if port forwarding or direct connection is in place.`);
            }
            else {
                console.log(`SIT: UPNP: Unable to Map: ${rejectedReason}`);
            }
        });
    }
}
exports.UPNPHelper = UPNPHelper;
//# sourceMappingURL=UPNPHelper.js.map