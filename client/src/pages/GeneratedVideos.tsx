import { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { VideoCard } from "../components/videos/video-card";
import { DeleteVideoDialog } from "../components/videos/delete-video-dialog";

interface VideoFile {
    name: string;
    size: number;
    createdAt: string;
}

const GeneratedVideos = () => {
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedVideoToDelete, setSelectedVideoToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/videos");
            setVideos(response.data.videos || []);
            setError(null);
        } catch (err) {
            setError("Failed to load videos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const downloadVideo = (filename: string) => {
        const link = document.createElement("a");
        link.href = `/storages/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openDeleteDialog = (filename: string) => {
        setSelectedVideoToDelete(filename);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedVideoToDelete) return;

        try {
            setDeleting(selectedVideoToDelete);
            await axios.delete(`/api/videos/${selectedVideoToDelete}`);
            setVideos(videos.filter((v) => v.name !== selectedVideoToDelete));
            setDeleteDialogOpen(false);
            setSelectedVideoToDelete(null);
        } catch (err) {
            setError("Failed to delete video");
            console.error(err);
        } finally {
            setDeleting(null);
        }
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
        <MainLayout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Generated Videos</h1>
                    <p className="text-muted-foreground">View and manage all generated videos</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex items-center justify-center min-h-96">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : videos.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
                        <p className="text-lg text-muted-foreground">No videos generated yet</p>
                        <p className="text-sm text-muted-foreground">Create videos on the Video page to see them here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <VideoCard key={video.name} name={video.name} size={video.size} createdAt={video.createdAt} deleting={deleting} onDownload={downloadVideo} onDelete={openDeleteDialog} />
                        ))}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <DeleteVideoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} videoName={selectedVideoToDelete} isDeleting={deleting === selectedVideoToDelete} onConfirm={confirmDelete} />
            </div>
        </MainLayout>
    );
};

export default GeneratedVideos;
