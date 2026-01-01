import { PlaylistAnalysis } from "@/types/playlist";

interface Props {
    summary: PlaylistAnalysis;
}

const PlaylistOverview = ({ summary }: Props) => {
    return (
        <div className="space-y-2">
            <h2 className="text-xl font-semibold">Playlist Summary</h2>

            <p>Total Videos: {summary.totalVideos}</p>
            <p>Total Duration: {summary.totalDuration}</p>
            <p>Average Video: {summary.averageVideoDuration}</p>
            <p>Remaining Videos: {summary.remainingVideos}</p>
            <p>Remaining Time: {summary.remainingDuration}</p>
        </div>
    );
};

export default PlaylistOverview;
