"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameControllerOverride = void 0;
class GameControllerOverride {
    container;
    profileHelper;
    databaseServer;
    sessionBackendUrl = {};
    constructor(container) {
        this.container = container;
        this.profileHelper = container.resolve("ProfileHelper");
        this.databaseServer = container.resolve("DatabaseServer");
    }
    setSessionBackendUrl(sessionID, backendUrl) {
        this.sessionBackendUrl[sessionID] = backendUrl;
    }
    getGameConfig(sessionID, backendUrl) {
        const profile = this.profileHelper.getPmcProfile(sessionID);
        const config = {
            languages: this.databaseServer.getTables().locales.languages,
            ndaFree: false,
            reportAvailable: false,
            twitchEventMember: false,
            lang: "en",
            aid: profile.aid,
            taxonomy: 6,
            activeProfileId: `pmc${sessionID}`,
            backend: {
                Lobby: backendUrl,
                Trading: backendUrl,
                Messaging: backendUrl,
                Main: backendUrl,
                RagFair: backendUrl,
            },
            useProtobuf: false,
            utc_time: new Date().getTime() / 1000,
            totalInGame: profile.Stats?.Eft?.TotalInGameTime ?? 0
        };
        return config;
    }
    override() {
        this.container.afterResolution("GameController", (_t, result) => {
            // We want to replace the original method logic with something different
            result.getGameConfig = (sessionID) => {
                // get the requestUrl for the sessionID
                let backendUrl = this.sessionBackendUrl[sessionID];
                delete this.sessionBackendUrl[sessionID];
                return this.getGameConfig(sessionID, backendUrl);
            };
            // The modifier Always makes sure this replacement method is ALWAYS replaced
        }, { frequency: "Always" });
    }
}
exports.GameControllerOverride = GameControllerOverride;
//# sourceMappingURL=GameControllerOverride.js.map