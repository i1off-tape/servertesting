"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoopMatch = exports.CoopMatchEndSessionMessages = void 0;
const FriendlyAI_1 = require("./FriendlyAI");
const WebSocketHandler_1 = require("./WebSocketHandler");
const MPMatchStatus_1 = require("./MPMatchStatus");
class CoopMatchEndSessionMessages {
    static HOST_SHUTDOWN_MESSAGE = "host-shutdown";
    static WEBSOCKET_TIMEOUT_MESSAGE = "websocket-timeout";
    static NO_PLAYERS_MESSAGE = "no-players";
}
exports.CoopMatchEndSessionMessages = CoopMatchEndSessionMessages;
class CoopMatch {
    /** The ServerId. The ProfileId of the host player. */
    ServerId;
    /** The Side of the match. */
    Side;
    /** The time the match was created. Useful for clearing out old matches. */
    CreatedDateTime = new Date();
    /** The time the match was last updated. Useful for clearing out old matches. */
    LastUpdateDateTime = new Date();
    /** The expected number of players. Used to hold the match before starting. Unused. */
    ExpectedNumberOfPlayers = 1;
    /** Game Version: To stop users mixing up SIT Versions. Causing significant sync issues. */
    GameVersion;
    /** SIT Version: To stop users mixing up SIT Versions. Causing significant sync issues. */
    SITVersion;
    /** Plain text password. Handled server side. */
    Password = undefined;
    Timestamp = undefined;
    /** The Connected Player Profiles. */
    ConnectedPlayers = [];
    /** The Connected User Profiles. */
    ConnectedUsers = [];
    /** Authorized Users (for password protection) */
    AuthorizedUsers = [];
    /** All characters in the game. Including AI */
    Characters = [];
    /** The Protocol the Match is using (P2P, Relay, etc) */
    Protocol;
    /** The IP Address the Match is using. Only set when the host desired. Otherwise, it is auto selected by the Client. */
    IPAddress;
    Port;
    LastDataByProfileId = {};
    PreviousSentData = [];
    PreviousSentDataMaxSize = 128;
    Status = MPMatchStatus_1.MPMatchStatus.Loading;
    Settings = {};
    LocationData;
    Location;
    Time;
    WeatherSettings;
    SpawnPoint = { x: 0, y: 0, z: 0 };
    friendlyAI;
    // private CheckStartTimeout : NodeJS.Timeout;
    // private CheckStillRunningInterval: NodeJS.Timeout;
    /** A STATIC Dictonary of Coop Matches. The Key is the Account Id of the Player that created it */
    static CoopMatches = {};
    static AirdropLoot = undefined;
    static saveServer;
    static locationController;
    constructor(inData) {
        this.ServerId = inData.serverId;
        this.Status = MPMatchStatus_1.MPMatchStatus.Loading;
        this.CreatedDateTime = new Date(Date.now());
        this.LastUpdateDateTime = new Date(Date.now());
        if (inData.settings === undefined)
            return;
        this.Side = inData.settings.side;
        this.Location = inData.settings.location;
        this.Time = inData.settings.timeVariant;
        this.WeatherSettings = inData.settings.timeAndWeatherSettings;
        this.friendlyAI = new FriendlyAI_1.friendlyAI();
        if (CoopMatch.CoopMatches[inData.serverId] !== undefined) {
            delete CoopMatch.CoopMatches[inData.serverId];
        }
        if (inData.settings === undefined)
            return;
        // Server settings
        this.ServerId = inData.serverId;
        this.Password = inData.password !== undefined ? inData.password : undefined;
        this.Protocol = inData.protocol;
        this.IPAddress = inData.ipAddress;
        this.Port = inData.port;
        this.GameVersion = inData.gameVersion;
        this.SITVersion = inData.sitVersion;
        this.AuthorizedUsers.push(inData.serverId);
        this.Status = MPMatchStatus_1.MPMatchStatus.Loading;
        this.CreatedDateTime = new Date(Date.now());
        this.LastUpdateDateTime = new Date(Date.now());
        // Raid settings
        this.Timestamp = inData.timestamp;
        this.Location = inData.settings.location;
        this.Time = inData.settings.timeVariant;
        this.WeatherSettings = inData.settings.timeAndWeatherSettings;
        this.ExpectedNumberOfPlayers = inData.expectedNumberOfPlayers;
        this.LocationData = CoopMatch.locationController.get("", {
            crc: 0, /* unused */
            locationId: this.Location,
            variantId: 0 /* unused */
        });
        this.friendlyAI = new FriendlyAI_1.friendlyAI();
    }
    ProcessData(info, logger) {
        if (info === undefined)
            return;
        if (Array.isArray(info)) {
            for (const indexOfInfo in info) {
                const _info = info[indexOfInfo];
                this.ProcessData(_info, logger);
            }
            return;
        }
        if (typeof (info) === "string") {
            // Old SIT Serializer used a '?' as a split of data
            if (info.indexOf("?") !== -1) {
                console.log(`coop match wants to process this info ${info} ?`);
                const infoMethod = info.split('?')[0];
                const infoData = info.split('?')[1];
                const newJObj = { m: infoMethod, data: infoData };
                this.ProcessData(newJObj, logger);
            }
            // 0.14
            // When SIT Serializer doesn't use a '?'
            else {
                console.log(`SIT ${info}. Will just redirect this out to Clients.`);
                // const newJObj = { data: info };
                // this.ProcessData(newJObj, logger);
                WebSocketHandler_1.WebSocketHandler.Instance.sendToWebSockets(this.ConnectedUsers, undefined, info);
            }
            return;
        }
        if (info.m === "Ping" && info.t !== undefined && info.profileId !== undefined) {
            this.Ping(info.profileId, info.t);
            return;
        }
        if (info.m === "SpawnPointForCoop") {
            this.SpawnPoint.x = info.x;
            this.SpawnPoint.y = info.y;
            this.SpawnPoint.z = info.z;
            return;
        }
        if (info.profileId !== undefined && info.m === "PlayerLeft") {
            this.PlayerLeft(info.profileId);
            if (this.ConnectedPlayers.length == 0)
                this.endSession(CoopMatchEndSessionMessages.NO_PLAYERS_MESSAGE);
            return;
        }
        if (info.profileId !== undefined)
            this.PlayerJoined(info.profileId);
        // logger.info(`Update a Coop Server [${info.serverId}][${info.m}]`);
        if (info.m !== "PlayerSpawn") {
            // this.LastData[info.m] = info;
            if (this.LastDataByProfileId[info.profileId] === undefined)
                this.LastDataByProfileId[info.profileId] = {};
            this.LastDataByProfileId[info.profileId][info.m] = info;
        }
        if (info.m === "PlayerSpawn") {
            // console.log(info);
            let foundExistingPlayer = false;
            for (const c of this.Characters) {
                if (info.profileId == c.profileId) {
                    foundExistingPlayer = true;
                    break;
                }
            }
            if (!foundExistingPlayer)
                this.Characters.push(info);
        }
        if (info.m === "Kill") {
            for (const c of this.Characters) {
                if (info.profileId == c.profileId) {
                    c.isDead = true;
                    break;
                }
            }
        }
        if (info.status !== undefined) {
            this.UpdateStatus(info.status);
        }
        this.LastUpdateDateTime = new Date(Date.now());
        const serializedData = JSON.stringify(info);
        // if (this.PreviousSentData.findIndex(x => x == serializedData) !== -1)
        // 	return;
        // if(this.PreviousSentData.length >= this.PreviousSentDataMaxSize)
        //     this.PreviousSentData = [];
        // this.PreviousSentData.push(serializedData);
        // console.log(info);
        WebSocketHandler_1.WebSocketHandler.Instance.sendToWebSockets(this.ConnectedUsers, undefined, serializedData);
    }
    UpdateStatus(inStatus) {
        this.Status = inStatus;
        console.log(`Updated server:[${this.ServerId}] to status [${inStatus}]`);
    }
    PlayerJoined(profileId) {
        if (this.ConnectedUsers.indexOf(profileId) === -1) {
            console.log(`Checking server authorization for profile: ${profileId}`);
            if (this.AuthorizedUsers.indexOf(profileId) === -1) {
                console.warn(`${profileId} is not authorized in server: ${this.ServerId}`);
                return false;
            }
            this.ConnectedUsers.push(profileId);
            console.log(`${this.ServerId}: ${profileId} has joined`);
        }
        if (this.ConnectedPlayers.indexOf(profileId) === -1) {
            this.ConnectedPlayers.push(profileId);
        }
        return true;
    }
    PlayerLeft(profileId) {
        this.ConnectedPlayers = this.ConnectedPlayers.filter(x => x != profileId);
        this.ConnectedUsers = this.ConnectedUsers.filter(x => x != profileId);
        this.AuthorizedUsers = this.AuthorizedUsers.filter(x => x != profileId);
        // If the Server Player has left, end the session
        if (this.ServerId == profileId) {
            this.endSession(CoopMatchEndSessionMessages.HOST_SHUTDOWN_MESSAGE);
        }
        console.log(`${this.ServerId}: ${profileId} has left`);
    }
    Ping(profileId, timestamp) {
        WebSocketHandler_1.WebSocketHandler.Instance.sendToWebSockets([profileId], undefined, JSON.stringify({ pong: timestamp }));
    }
    endSession(reason) {
        console.log(`COOP SESSION ${this.ServerId} HAS BEEN ENDED: ${reason}`);
        WebSocketHandler_1.WebSocketHandler.Instance.sendToWebSockets(this.ConnectedPlayers, undefined, JSON.stringify({ "endSession": true, reason: reason }));
        this.Status = MPMatchStatus_1.MPMatchStatus.Complete;
        //clearTimeout(this.SendLastDataInterval);
        // clearTimeout(this.CheckStartTimeout);
        // clearInterval(this.CheckStillRunningInterval);
        this.LocationData = null;
        delete CoopMatch.CoopMatches[this.ServerId];
    }
    static routeHandler(container) {
        // const dynamicRouterModService = container.resolve<DynamicRouterModService>("DynamicRouterModService");
        // const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        //  staticRouterModService.registerStaticRouter(
        //     "MyStaticModRouterSITConfig",
        //     [
        //         {
        //             url: "/coop/server/getAllForLocation",
        //             action: (url, info: any, sessionId: string, output) => {
        //                 console.log(info);
        //                 const matches : CoopMatch[] = [];
        //                 for(let itemKey in CoopMatch.CoopMatches) {
        //                     matches.push(CoopMatch.CoopMatches[itemKey]);
        //                 }
        //                 output = JSON.stringify(matches);
        //                 return output;
        //             }
        //         }
        //     ]
        //     ,"aki"
        // )
    }
}
exports.CoopMatch = CoopMatch;
//# sourceMappingURL=CoopMatch.js.map