import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Upload, X, Loader2, CheckCircle, Video as VideoIcon } from "lucide-react";
import axios from "axios";

interface GenerateVideoResponse {
    message: string;
    videoUrl: string;
    images?: Array<{ name: string; size: number }>;
}

type ViewMode = "generate" | "continue";

const Video = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("generate");

    // Generate mode states
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<GenerateVideoResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Continue mode states
    const [continuePrompt, setContinuePrompt] = useState("");
    const [continueLoading, setContinueLoading] = useState(false);
    const [continueResponse, setContinueResponse] = useState<GenerateVideoResponse | null>(null);
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

        if (!response?.videoUrl) {
            setContinueError("No previous video URL found");
            return;
        }

        setContinueLoading(true);
        setContinueResponse(null);

        try {
            const result = await axios.post("/api/generate-video-continue", {
                prompt: continuePrompt,
                urlHistory: response.videoUrl,
            });

            setContinueResponse(result.data);
            setContinuePrompt("");
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
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {!response && !continueResponse ? (
                        <>
                            <div className="mb-12 text-center">
                                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Generate Video with AI</h1>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Upload images and describe your vision. Our AI will create a video based on your prompt.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="rounded-xl border border-border bg-card shadow-lg p-8">
                                    <h2 className="text-2xl font-bold mb-2">Upload Images</h2>
                                    <p className="text-muted-foreground mb-6">Select between 1 and 5 images (JPG, PNG, GIF, or WebP)</p>

                                    <label className="flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:border-primary">
                                        <div className="flex flex-col items-center gap-3">
                                            <Upload className="h-12 w-12 text-muted-foreground" />
                                            <div className="text-center">
                                                <p className="font-semibold text-foreground">Click to upload images</p>
                                                <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                                            </div>
                                        </div>
                                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={loading} />
                                    </label>

                                    {previews.length > 0 && (
                                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {previews.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow" />
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button type="button" size="sm" variant="destructive" onClick={() => removeImage(index)} disabled={loading} className="rounded-lg">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="absolute bottom-2 left-2">
                                                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Image {index + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-border bg-card shadow-lg p-8">
                                    <h2 className="text-2xl font-bold mb-2">Your Prompt</h2>
                                    <p className="text-muted-foreground mb-4">Describe what video you want to create</p>
                                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: A magical forest with glowing trees transforming into a night sky..." className="w-full min-h-40 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all" disabled={loading} />
                                </div>

                                {error && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 space-y-3">
                                        <div>{error}</div>
                                    </div>
                                )}

                                <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold rounded-lg transition-all" disabled={loading || images.length < 1 || images.length > 5 || !prompt.trim()}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Generating Video...
                                        </>
                                    ) : (
                                        "Generate Video"
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : response && !continueResponse ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 p-6 flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-green-900 dark:text-green-100">Success!</h3>
                                    <p className="text-sm text-green-800 dark:text-green-200">Your video has been generated</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/50 flex items-center gap-2">
                                    <VideoIcon className="h-5 w-5" />
                                    <h2 className="text-2xl font-bold">Generated Video</h2>
                                </div>
                                <video controls className="w-full h-auto" src={response.videoUrl} />
                            </div>

                            {response.images && response.images.length > 0 && (
                                <div className="rounded-xl border border-border bg-card shadow-lg p-6">
                                    <h3 className="font-bold mb-3">Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-semibold">Status:</span> {response.message}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Images Processed:</span> {response.images.length}
                                        </p>
                                        {response.images.map((img, idx) => (
                                            <p key={idx} className="text-muted-foreground">
                                                • {img.name} ({(img.size / 1024).toFixed(2)} KB)
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 flex-col md:flex-row">
                                <Button
                                    onClick={() => {
                                        setResponse(null);
                                        setError(null);
                                        setImages([]);
                                        setPreviews([]);
                                        setPrompt("");
                                    }}
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Generate New
                                </Button>
                                <Button onClick={() => setViewMode("continue")} size="lg" variant="outline" className="flex-1 rounded-lg">
                                    Continue with this Frame
                                </Button>
                                <Button
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = response.videoUrl;
                                        link.download = `generated-video-${Date.now()}.mp4`;
                                        link.click();
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Download Video
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    {viewMode === "continue" && response && !continueResponse && (
                        <div className="space-y-6 animate-in fade-in duration-500 mt-8 border-t pt-8">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold mb-2">Continue Video Generation</h2>
                                <p className="text-muted-foreground">Describe how to continue from the previous frame</p>
                            </div>

                            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/50">
                                    <h3 className="font-bold mb-2">Previous Video</h3>
                                </div>
                                <video controls className="w-full h-auto" src={response.videoUrl} />
                            </div>

                            <form onSubmit={handleContinueSubmit} className="space-y-6">
                                <div className="rounded-xl border border-border bg-card shadow-lg p-8">
                                    <h2 className="text-2xl font-bold mb-2">Continuation Prompt</h2>
                                    <p className="text-muted-foreground mb-4">Describe how to continue the video from this frame (in English)</p>
                                    <textarea value={continuePrompt} onChange={(e) => setContinuePrompt(e.target.value)} placeholder="Example: The forest becomes darker as night falls, with even more glowing lights appearing..." className="w-full min-h-40 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all" disabled={continueLoading} />
                                </div>

                                {continueError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 space-y-3">
                                        <div>{continueError}</div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={() => setViewMode("generate")} size="lg" variant="outline" className="flex-1 rounded-lg">
                                        Back
                                    </Button>
                                    <Button type="submit" size="lg" className="flex-1 rounded-lg" disabled={continueLoading || !continuePrompt.trim()}>
                                        {continueLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Continuation"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {continueResponse && (
                        <div className="space-y-6 animate-in fade-in duration-500 mt-8 border-t pt-8">
                            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 p-6 flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-green-900 dark:text-green-100">Continuation Generated!</h3>
                                    <p className="text-sm text-green-800 dark:text-green-200">Your video continuation has been created</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/50 flex items-center gap-2">
                                    <VideoIcon className="h-5 w-5" />
                                    <h2 className="text-2xl font-bold">Continued Video</h2>
                                </div>
                                <video controls className="w-full h-auto" src={continueResponse.videoUrl} />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setResponse(continueResponse);
                                        setContinueResponse(null);
                                        setViewMode("continue");
                                    }}
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Continue Again
                                </Button>
                                <Button
                                    onClick={() => {
                                        setResponse(null);
                                        setContinueResponse(null);
                                        setViewMode("generate");
                                        setImages([]);
                                        setPreviews([]);
                                        setPrompt("");
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Start New
                                </Button>
                                <Button
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = continueResponse.videoUrl;
                                        link.download = `generated-video-${Date.now()}.mp4`;
                                        link.click();
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Download Video
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Video;
