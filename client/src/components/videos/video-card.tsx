import { Button } from "../ui/button";
import { Download, Trash2, Loader2 } from "lucide-react";

interface VideoCardProps {
    name: string;
    size: number;
    createdAt: string;
    deleting: string | null;
    onDownload: (filename: string) => void;
    onDelete: (filename: string) => void;
}

export const VideoCard = ({ name, size, createdAt, deleting, onDownload, onDelete }: VideoCardProps) => {
    const generatePoster = (filename: string) => {
        const hash = filename.split("").reduce((acc, char) => {
            return (acc << 5) - acc + char.charCodeAt(0);
        }, 0);

        const hue1 = Math.abs(hash) % 360;
        const hue2 = (Math.abs(hash) + 60) % 360;

        return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
            {/* Video Preview */}
            <div className="aspect-video bg-muted/50 flex items-center justify-center relative group" style={{ backgroundImage: generatePoster(name) }}>
                <video src={`/storages/${name}`} className="w-full h-full object-cover" controls preload="none" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none" />

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:bg-white/30 transition-colors">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6 3v10l8-5z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                <h3 className="font-medium truncate text-sm">{name}</h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>{formatFileSize(size)}</p>
                    <p>{formatDate(createdAt)}</p>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onDownload(name)} disabled={deleting === name}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(name)} disabled={deleting === name}>
                        {deleting === name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
