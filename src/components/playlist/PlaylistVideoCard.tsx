import Image from "next/image";
import { VideoMetadata } from "@/types/playlist";

interface Props {
    video: VideoMetadata;
}

const PlaylistVideoCard = ({ video }: Props) => {
    return (
        <div className="flex gap-3 items-center border rounded-lg p-2">
            <Image
                src={video.thumbnail}
                alt={video.title}
                width={120}
                height={68}
                className="rounded"
            />

            <div className="min-w-0">
                <p className="font-medium truncate">{video.title}</p>
                <p className="text-sm text-primary-500">
                    {video.channelTitle} · {video.durationFormatted}
                </p>
            </div>
        </div>
    );
};

export default PlaylistVideoCard;
