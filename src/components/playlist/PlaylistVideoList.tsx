import { VideoMetadata } from "@/types/playlist";
import PlaylistVideoCard from "./PlaylistVideoCard";

interface Props {
    videos: VideoMetadata[];
}

const PlaylistVideoList = ({ videos }: Props) => {
    if (videos.length === 0) return null;

    return (
        <div>
            <h3 className="font-semibold mb-3">Videos ({videos.length})</h3>

            <div className="space-y-3">
                {videos.map((video) => (
                    <PlaylistVideoCard key={video.videoId} video={video} />
                ))}
            </div>
        </div>
    );
};

export default PlaylistVideoList;
