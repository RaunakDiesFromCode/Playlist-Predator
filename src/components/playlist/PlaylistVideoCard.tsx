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
            className={`flex items-center overflow-hidden pr-2 ${
                watched ? "opacity-60" : ""
            }`}
        >
            <Link
                href={`https://youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full"
            >
                <Image
                    src={video.thumbnail}
                    alt={video.title}
                    width={120}
                    height={68}
                    className=""
                />

                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.title}</p>
                    <p className="text-sm text-foreground/70">
                        {video.channelTitle} · {video.durationFormatted}
                    </p>
                </div>
            </Link>

            <Button
                onClick={() => onToggle(video.videoId)}
                size={"icon"}
                className={`text-xs px-2 py-1 rounded-full ${
                    watched ? "bg-green-600 hover:bg-green-700 text-white" : ""
                }`}
            >
                {watched ? <Check /> : <Clock />}
            </Button>
        </Card>
    );
};

export default PlaylistVideoCard;
