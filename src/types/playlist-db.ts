export type DbPlaylist = {
    id: string;
    user_id: string;
    youtube_playlist_id: string;
    title: string | null;
    thumbnail: string | null;
    invite_token?: string | null;
    invite_enabled?: boolean;
    created_at: string;
    updated_at: string;
};
