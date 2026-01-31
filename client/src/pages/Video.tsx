import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { Upload, X, Loader2, CheckCircle, Video as VideoIcon, Repeat } from "lucide-react";
import axios from "axios";

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
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 md:p-8">
                <div className="max-w-7xl mx-auto space-y-10">
                    {!response ? (
                        <>
                            <div className="text-center">
                                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Generate Video with AI</h1>
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Upload images and describe your vision. Continue the video with a new prompt whenever you want.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upload Images</CardTitle>
                                        <CardDescription>Select between 1 and 5 images (JPG, PNG, GIF, or WebP)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <Label className="flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:border-primary">
                                            <div className="flex flex-col items-center gap-3">
                                                <Upload className="h-12 w-12 text-muted-foreground" />
                                                <div className="text-center">
                                                    <p className="font-semibold text-foreground">Click to upload images</p>
                                                    <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                                                </div>
                                            </div>
                                            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={loading} />
                                        </Label>

                                        {previews.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {previews.map((preview, index) => (
                                                    <div key={index} className="relative group">
                                                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow" />
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button type="button" size="sm" variant="destructive" onClick={() => removeImage(index)} disabled={loading} className="rounded-lg">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="absolute bottom-2 left-2">
                                                            <Badge variant="secondary">Image {index + 1}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Your Prompt</CardTitle>
                                        <CardDescription>Describe what video you want to create</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: A magical forest with glowing trees transforming into a night sky..." className="min-h-40" disabled={loading} />
                                    </CardContent>
                                </Card>

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
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <Card className="border-green-200/70 bg-green-50/50 dark:bg-green-950/40">
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <div>
                                        <CardTitle>Success!</CardTitle>
                                        <CardDescription>Your video has been generated</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <VideoIcon className="h-5 w-5" />
                                        <CardTitle>Generated Videos</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="w-full whitespace-nowrap">
                                        <div className="flex gap-4">
                                            {history.map((item, index) => (
                                                <div key={`${item.videoUrl}-${index}`} className="min-w-[240px] w-[240px] rounded-lg border border-border bg-background overflow-hidden">
                                                    <video controls className="w-full h-40 object-cover" src={item.videoUrl} />
                                                    <div className="p-3 text-xs text-muted-foreground">Video {index + 1}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            <form onSubmit={handleContinueSubmit} className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Continue the Video</CardTitle>
                                        <CardDescription>Describe how to continue the video (in English)</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea value={continuePrompt} onChange={(e) => setContinuePrompt(e.target.value)} placeholder="Example: The camera zooms out, revealing the city at sunset..." className="min-h-32" disabled={continueLoading} />
                                    </CardContent>
                                </Card>

                                {continueError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 space-y-3">
                                        <div>{continueError}</div>
                                    </div>
                                )}

                                <div className="flex gap-3 flex-col md:flex-row">
                                    <Button type="submit" size="lg" className="flex-1 rounded-lg" disabled={continueLoading || !continuePrompt.trim()}>
                                        {continueLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Repeat className="h-5 w-5 mr-2" />
                                                Continue Generation
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setResponse(null);
                                            setContinuePrompt("make video: continue from video before");
                                            setContinueError(null);
                                            setImages([]);
                                            setPreviews([]);
                                            setPrompt("");
                                            setHistory([]);
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
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Video;
