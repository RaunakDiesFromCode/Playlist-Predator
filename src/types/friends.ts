export type CrewMemberRole = "owner" | "member";
export type LobbyMemberRole = CrewMemberRole;

export interface CrewMember {
    userId: string;
    name: string;
    role: CrewMemberRole;
    joinedAt: string;
    doneCount: number;
    rewatchCount: number;
    skippedCount: number;
    totalVideos: number;
    completionPercentage: number;
    lastActiveAt?: string | null;
}
export type LobbyMember = CrewMember;

export interface CrewInfo {
    playlistId: string;
    youtubePlaylistId: string;
    title: string | null;
    thumbnail: string | null;
    isOwner: boolean;
    inviteToken: string;
    inviteEnabled: boolean;
    members: CrewMember[];
}
export type LobbyInfo = CrewInfo;

export interface JoinCrewResponse {
    playlistId: string;
    youtubePlaylistId: string;
    title: string | null;
    thumbnail: string | null;
    role: CrewMemberRole;
}
export type JoinLobbyResponse = JoinCrewResponse;
