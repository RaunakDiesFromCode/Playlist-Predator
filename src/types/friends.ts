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

export interface VideoCrewMember {
    userId: string;
    name: string;
    role: CrewMemberRole;
    completedAt?: string | null;
}

export interface CrewInfo {
    playlistId: string;
    youtubePlaylistId: string;
    title: string | null;
    thumbnail: string | null;
    isOwner: boolean;
    inviteToken: string;
    inviteEnabled: boolean;
    members: CrewMember[];
    videoCompletions?: Record<string, VideoCrewMember[]>;
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
