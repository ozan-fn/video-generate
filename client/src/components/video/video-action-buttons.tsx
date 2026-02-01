import { Button } from "../ui/button";

interface VideoActionButtonsProps {
    videoUrl: string;
    onStartNew: () => void;
}

export const VideoActionButtons = ({ videoUrl, onStartNew }: VideoActionButtonsProps) => {
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `generated-video-${Date.now()}.mp4`;
        link.click();
    };

    return (
        <div className="flex gap-3">
            <Button onClick={onStartNew} variant="outline" size="lg" className="flex-1">
                Start New
            </Button>
            <Button onClick={handleDownload} variant="outline" size="lg" className="flex-1">
                Download Video
            </Button>
        </div>
    );
};
