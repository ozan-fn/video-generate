import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { VideoPageHeader } from "../components/video/video-page-header";
import { VideoUploadSection } from "../components/video/video-upload-section";
import { VideoImagePreviewGrid } from "../components/video/video-image-preview-grid";
import { VideoPromptInput } from "../components/video/video-prompt-input";
import { VideoErrorDisplay } from "../components/video/video-error-display";
import { VideoSuccessBanner } from "../components/video/video-success-banner";
import { VideoHistoryScroll } from "../components/video/video-history-scroll";
import { VideoContinueForm } from "../components/video/video-continue-form";
import { VideoActionButtons } from "../components/video/video-action-buttons";

interface GenerateVideoResponse {
    message: string;
    videoUrl: string;
    urlHistory?: string;
    images?: Array<{ name: string; size: number }>;
}

const Video = () => {
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<GenerateVideoResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<GenerateVideoResponse[]>([]);

    const [continuePrompt, setContinuePrompt] = useState("make video: continue from video before");
    const [continueLoading, setContinueLoading] = useState(false);
    const [continueError, setContinueError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const selectedFiles = Array.from(files).slice(0, 5);
        setImages(selectedFiles);
        setError(null);

        const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
        setPreviews(previewUrls);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (images.length < 1 || images.length > 5) {
            setError("Please select between 1 and 5 images");
            return;
        }

        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const formData = new FormData();
            images.forEach((image) => {
                formData.append("images", image);
            });
            formData.append("prompt", prompt);

            const result = await axios.post("/api/generate-video", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResponse(result.data);
            setHistory((prev) => [...prev, result.data]);
            setPrompt("");
            setImages([]);
            setPreviews([]);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Failed to generate";
            setError(errorMsg);
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContinueError(null);

        if (!continuePrompt.trim()) {
            setContinueError("Please enter a prompt");
            return;
        }

        if (!response?.urlHistory) {
            setContinueError("No urlHistory found");
            return;
        }

        setContinueLoading(true);

        try {
            const result = await axios.post("/api/generate-video-continue", {
                prompt: continuePrompt,
                urlHistory: response.urlHistory,
            });

            setResponse(result.data);
            setHistory((prev) => [...prev, result.data]);
            setContinuePrompt("make video: continue from video before");
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Failed to generate";
            setContinueError(errorMsg);
            console.error("Error:", err);
        } finally {
            setContinueLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="container py-6 space-y-6">
                {!response ? (
                    <>
                        <VideoPageHeader />

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <VideoUploadSection onImageChange={handleImageChange} disabled={loading} />

                            <VideoImagePreviewGrid previews={previews} onRemove={removeImage} disabled={loading} />

                            <VideoPromptInput value={prompt} onChange={setPrompt} disabled={loading} />

                            {error && <VideoErrorDisplay error={error} />}

                            <Button type="submit" size="lg" className="w-full" disabled={loading || images.length < 1 || images.length > 5 || !prompt.trim()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating Video...
                                    </>
                                ) : (
                                    "Generate Video"
                                )}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="space-y-6">
                        <VideoSuccessBanner />

                        <VideoHistoryScroll history={history} />

                        <VideoContinueForm prompt={continuePrompt} onPromptChange={setContinuePrompt} onSubmit={handleContinueSubmit} loading={continueLoading} error={continueError} />

                        <VideoActionButtons
                            videoUrl={response.videoUrl}
                            onStartNew={() => {
                                setResponse(null);
                                setContinuePrompt("make video: continue from video before");
                                setContinueError(null);
                                setImages([]);
                                setPreviews([]);
                                setPrompt("");
                                setHistory([]);
                            }}
                        />
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Video;
