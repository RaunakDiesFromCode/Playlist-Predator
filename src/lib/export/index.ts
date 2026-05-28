export { buildPlaylistCsvExport } from "./export-csv";
export { buildPlaylistJsonExport } from "./export-json";
export type {
    PlaylistExportCounts,
    PlaylistExportFormat,
    PlaylistExportSnapshot,
    PlaylistExportStatus,
    PlaylistExportVideo,
} from "./shared";

export function downloadExportFile({
    content,
    filename,
    mimeType,
}: {
    content: string;
    filename: string;
    mimeType: string;
}) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener noreferrer";
    anchor.click();

    URL.revokeObjectURL(url);
}
