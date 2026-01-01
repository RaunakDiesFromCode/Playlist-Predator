import { VideoMetadata } from "@/types/playlist";
import PlaylistVideoCard from "./PlaylistVideoCard";
import { PlaylistProgress } from "@/types/progress";

interface Props {
    videos: VideoMetadata[];
    progress: PlaylistProgress;
    onToggle: (id: string) => void;
}


const PlaylistVideoList = ({ videos, progress, onToggle }: Props) => {
    if (videos.length === 0) return null;

    return (
        <div>
            <h3 className="font-semibold mb-3">Videos ({videos.length})</h3>

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
    );
};

export default PlaylistVideoList;
