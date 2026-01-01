import Image from "next/image";
import { VideoMetadata } from "@/types/playlist";
import { Card } from "../ui/Card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Check, Clock } from "lucide-react";

interface Props {
    video: VideoMetadata;
    watched: boolean;
    onToggle: (id: string) => void;
}

const PlaylistVideoCard = ({ video, watched, onToggle }: Props) => {
    return (
        <Card
            className={`group flex items-center gap-3 p-2 transition-opacity ${
                watched ? "opacity-60" : ""
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
            <Button
                onClick={() => onToggle(video.videoId)}
                size="icon"
                variant={watched ? "default" : "secondary"}
                className={`h-9 w-9 rounded-full shrink-0 ${
                    watched
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "opacity-0 group-hover:opacity-100 transition-opacity"
                }`}
            >
                {watched ? (
                    <Check className="h-4 w-4" />
                ) : (
                    <Clock className="h-4 w-4" />
                )}
            </Button>
        </Card>
    );
};

export default PlaylistVideoCard;
