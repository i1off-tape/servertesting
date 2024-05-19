"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatHelper = void 0;
const ws_1 = __importDefault(require("C:/snapshot/project/node_modules/ws"));
const StayInTarkovMod_1 = require("./StayInTarkovMod");
class EndPoints {
    StunIp;
    StunPort;
    UpnpIp;
    UpnpPort;
    PortForwardingIp;
    PortForwardingPort;
    constructor(stunIp, stunPort, upnpIp, upnpPort, portForwardingIp, portForwardingPort) {
        this.StunIp = stunIp;
        this.StunPort = stunPort;
        this.UpnpIp = upnpIp;
        this.UpnpPort = upnpPort;
        this.PortForwardingIp = portForwardingIp;
        this.PortForwardingPort = portForwardingPort;
    }
}
class NatHelper {
    static Instance;
    logger;
    webSockets = {};
    constructor(webSocketPort, logger) {
        NatHelper.Instance = this;
        this.logger = logger;
        const webSocketServer = new ws_1.default.Server({
            port: webSocketPort,
            perMessageDeflate: {
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            }
        });
        webSocketServer.addListener("listening", () => {
            console.log(`SIT: TCP Nat Helper WebSocket is listening on ${webSocketPort}`);
        });
        webSocketServer.addListener("connection", this.wsOnConnection.bind(this));
    }
    wsOnConnection(ws, req) {
        const wsh = this;
        // Strip request and break it into sections
        const splitUrl = req.url.substring(0, req.url.indexOf("?")).split("/");
        const sessionID = splitUrl.pop();
        ws.on("message", async function message(msg) {
            wsh.processMessage(msg, req);
        });
        ws.on("close", async (code, reason) => {
            wsh.processClose(ws, sessionID);
        });
        this.webSockets[sessionID] = ws;
        console.log(`${sessionID} has connected to Nat Helper!`);
    }
    // Requests are sent to the serverId (host)
    // Responses are sent back to the requester's profileId (client)
    async processMessage(msg, req) {
        const msgObj = JSON.parse(msg.toString());
        console.log(msg.toString());
        if (msgObj.requestId !== undefined && msgObj.requestType !== undefined) {
            if (msgObj.requestType == "getEndPointsRequest") {
                this.webSockets[msgObj.serverId].send(msg.toString());
            }
            if (msgObj.requestType == "natPunchRequest") {
                this.webSockets[msgObj.serverId].send(msg.toString());
            }
            if (msgObj.requestType == "getEndPointsResponse") {
                const coopMatch = StayInTarkovMod_1.StayInTarkovMod.Instance.getCoopMatch(msgObj.serverId);
                if (coopMatch !== undefined) {
                    msgObj.publicEndPoints["remote"] = `${req.socket.remoteAddress.split(":")[3]}:${coopMatch.Port}`;
                    this.webSockets[msgObj.profileId].send(JSON.stringify(msgObj));
                }
            }
            if (msgObj.requestType == "natPunchResponse") {
                this.webSockets[msgObj.profileId].send(msg.toString());
            }
        }
    }
    async processClose(ws, sessionId) {
        // console.log("processClose");
        // console.log(ws);
        console.log(`Web Socket ${sessionId} has disconnected from Nat Helper!`);
        if (this.webSockets[sessionId] !== undefined)
            delete this.webSockets[sessionId];
    }
}
exports.NatHelper = NatHelper;
//# sourceMappingURL=NatHelper.js.map