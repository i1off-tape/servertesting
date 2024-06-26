import { MPMatchStatus } from "./MPMatchStatus";

export class MPMatchResponse {
    ServerId: string;
    HostProfileId: string;
    HostName: string;
    Settings: any = {};
    RaidTime: string;
    Location: string;
    PlayerCount: number;
    ExpectedPlayerCount: number;
    GameVersion: string;
    SITVersion: string;
    IsPasswordLocked: boolean;
    Protocol: string;
    IPAddress: string;
    Status: MPMatchStatus;
}