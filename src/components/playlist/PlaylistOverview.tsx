// import { PlaylistAnalysis } from "@/types/playlist";

interface Props {
    totalVideos: number;
    watchedVideos: number;
    totalDuration: string;
    remainingDuration: string;
}


const PlaylistOverview = ({ totalVideos, watchedVideos, totalDuration, remainingDuration }: Props) => {
    return (
        <div className="space-y-2">
            <h2 className="text-xl font-semibold">Playlist Summary</h2>

            <p>Total Videos: {totalVideos}</p>
            <p>Total Duration: {totalDuration}</p>
            {/* <p>Average Video: {summary.averageVideoDuration}</p> */}
            <p>Remaining Videos: {Math.max(totalVideos - watchedVideos, 0)}</p>
            <p>Remaining Time: {remainingDuration}</p>
        </div>
    );
};

export default PlaylistOverview;
