import Image from "next/image";
import { VideoMetadata } from "@/types/playlist";

interface Props {
    video: VideoMetadata;
    watched: boolean;
    onToggle: (id: string) => void;
}

const PlaylistVideoCard = ({ video, watched, onToggle }: Props) => {
    return (
        <div
            className={`flex gap-3 items-center border rounded-lg p-2 ${
                watched ? "opacity-60" : ""
            }`}
        >
            <Image
                src={video.thumbnail}
                alt={video.title}
                width={120}
                height={68}
                className="rounded"
            />

            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{video.title}</p>
                <p className="text-sm text-gray-500">
                    {video.channelTitle} · {video.durationFormatted}
                </p>
            </div>

            <button
                onClick={() => onToggle(video.videoId)}
                className={`text-xs px-2 py-1 rounded ${
                    watched ? "bg-green-600 text-white" : "bg-gray-200"
                }`}
            >
                {watched ? "Watched" : "Mark"}
            </button>
        </div>
    );
};

export default PlaylistVideoCard;
