import { PlaylistMeta, VideoMetadata } from "@/types/playlist";
import PlaylistVideoCard from "./PlaylistVideoCard";
import { PlaylistProgress } from "@/types/progress";
import Image from "next/image";

interface Props {
    videos: VideoMetadata[];
    progress: PlaylistProgress;
    onToggle: (id: string) => void;
    playlist: PlaylistMeta | null;
}

const PlaylistVideoList = ({ videos, progress, onToggle, playlist }: Props) => {
    if (videos.length === 0) return null;

    const playlistThumbnail = videos[0].thumbnail;

    return (
        <div className="space-y-2">
            {/* Playlist header */}
            <div className="relative w-full overflow-hidden rounded-t-xl">
                <Image
                    src={playlistThumbnail}
                    alt="Playlist cover"
                    className="w-full h-auto object-cover"
                    width={1200}
                    height={675}
                    priority
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

                {/* Text overlay */}
                <div className="absolute bottom-4 left-4 z-10">
                    <h2 className="text-3xl font-semibold leading-tight">
                        {playlist?.title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {playlist?.channelTitle}
                    </p>
                </div>
            </div>

            {/* Video list */}
            <div>
                <div className="space-y-3">
                    {videos.map((video) => (
                        <PlaylistVideoCard
                            key={video.videoId}
                            video={video}
                            watched={!!progress[video.videoId]?.watched}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlaylistVideoList;
