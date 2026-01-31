import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";

interface GenerateResponse {
    message: string;
    image: string;
    images: Array<{ name: string; size: number }>;
}

const Home = () => {
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<GenerateResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorScreenshot, setErrorScreenshot] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const selectedFiles = Array.from(files).slice(0, 2);
        setImages(selectedFiles);
        setError(null);
        setErrorScreenshot(null);

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
        setErrorScreenshot(null);

        if (images.length !== 2) {
            setError("Please select exactly 2 images");
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

            const result = await axios.post("/api/generate", formData, {
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
            setErrorScreenshot(err.response?.data?.screenshot || null);
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Generate Video with AI</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Upload 2 images and describe your vision. Our AI will create a video based on your prompt.</p>
                    </div>

                    {/* Main Content */}
                    {!response ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload Card */}
                            <div className="rounded-xl border border-border bg-card shadow-lg p-8">
                                <h2 className="text-2xl font-bold mb-2">Upload Images</h2>
                                <p className="text-muted-foreground mb-6">Select exactly 2 images (JPG, PNG, GIF, or WebP)</p>

                                {/* Upload Area */}
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

                                {/* Image Previews */}
                                {previews.length > 0 && (
                                    <div className="mt-6 grid grid-cols-2 gap-4">
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

                            {/* Prompt Card */}
                            <div className="rounded-xl border border-border bg-card shadow-lg p-8">
                                <h2 className="text-2xl font-bold mb-2">Your Prompt</h2>
                                <p className="text-muted-foreground mb-4">Describe what video you want to create</p>
                                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Example: A magical forest with glowing trees transforming into a night sky..." className="w-full min-h-40 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all" disabled={loading} />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200 space-y-3">
                                    <div>{error}</div>
                                    {errorScreenshot && (
                                        <div className="rounded-md overflow-hidden border border-red-200/50">
                                            <img src={errorScreenshot} alt="Error screenshot" className="w-full h-auto" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button type="submit" size="lg" className="w-full h-12 text-lg font-semibold rounded-lg transition-all" disabled={loading || images.length !== 2 || !prompt.trim()}>
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
                    ) : (
                        // Success Response
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Success Message */}
                            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 p-6 flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-green-900 dark:text-green-100">Success!</h3>
                                    <p className="text-sm text-green-800 dark:text-green-200">Your video has been generated</p>
                                </div>
                            </div>

                            {/* Generated Image */}
                            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                                <div className="p-6 border-b border-border bg-muted/50">
                                    <h2 className="text-2xl font-bold">Generated Video Frame</h2>
                                </div>
                                <img src={response.image} alt="Generated result" className="w-full h-auto" />
                            </div>

                            {/* Info Card */}
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

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setResponse(null);
                                        setError(null);
                                    }}
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Generate Another
                                </Button>
                                <Button
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = response.image;
                                        link.download = `video-frame-${Date.now()}.png`;
                                        link.click();
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 rounded-lg"
                                >
                                    Download Image
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Home;
