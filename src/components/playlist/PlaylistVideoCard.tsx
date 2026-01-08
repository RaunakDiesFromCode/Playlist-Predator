import Image from "next/image";
import { VideoMetadata } from "@/types/playlist";
import { Card } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { VideoStatus } from "@/types/progress";

interface Props {
    video: VideoMetadata;
    currentStatus: VideoStatus;
    onStatusChange: (id: string, status: VideoStatus) => void;
}

const PlaylistVideoCard = ({ video, currentStatus, onStatusChange }: Props) => {
    return (
        <Card
            className={`group flex items-center gap-3 p-2 transition-colors backdrop-blur-sm ${
                currentStatus === "DONE" || currentStatus === "SKIP" ? "opacity-60" : ""
            }`}
        >
            {/* Clickable content */}
            <Link
                href={`https://youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
            >
                {/* Thumbnail */}
                <div className="relative w-[120px] aspect-video flex-shrink-0 overflow-hidden rounded-md bg-black/10">
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Text */}
                <div className="min-w-0">
                    <p className="font-medium leading-snug truncate">
                        {video.title}
                    </p>
                    <p className="text-sm text-foreground/70 truncate">
                        {video.channelTitle} · {video.durationFormatted}
                    </p>
                </div>
            </Link>

            {/* Action */}
            <div className="flex gap-1">
                {["DONE", "STUDY", "REWATCH", "SKIP"].map((s) => (
                    <Button
                        key={s}
                        onClick={() =>
                            onStatusChange(video.videoId, s as VideoStatus)
                        }
                        variant={currentStatus === s ? "default" : "secondary"}
                        size="sm"
                    >
                        {s}
                    </Button>
                ))}
            </div>
        </Card>
    );
};

export default PlaylistVideoCard;
