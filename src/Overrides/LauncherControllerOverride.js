"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LauncherControllerOverride = void 0;
class LauncherControllerOverride {
    container;
    saveServer;
    gameControllerOverride;
    constructor(container, gameControllerOverride) {
        this.container = container;
        this.saveServer = container.resolve("SaveServer");
        this.gameControllerOverride = gameControllerOverride;
    }
    login(info) {
        //let backendUrl: string = `${this.coopConfig.protocol}://${this.coopConfig.externalIP}:${this.httpConfig.port}`;
        for (const sessionID in this.saveServer.getProfiles()) {
            const account = this.saveServer.getProfile(sessionID).info;
            if (info.username === account.username) {
                if (info.password === account.password) {
                    if (info.backendUrl !== undefined && info.backendUrl !== "") {
                        this.gameControllerOverride.setSessionBackendUrl(sessionID, info.backendUrl);
                        return sessionID;
                    }
                }
                else {
                    return "INVALID_PASSWORD";
                }
            }
        }
        return "";
    }
    override() {
        this.container.afterResolution("LauncherController", (_t, result) => {
            // /launcher/profile/login
            result.login = (info) => {
                return this.login(info);
            };
        }, { frequency: "Always" });
    }
}
exports.LauncherControllerOverride = LauncherControllerOverride;
//# sourceMappingURL=LauncherControllerOverride.js.map