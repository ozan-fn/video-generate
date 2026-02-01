import { useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { PageHeader } from "../components/home/page-header";
import { ImageUploadSection } from "../components/home/image-upload-section";
import { ImagePreviewGrid } from "../components/home/image-preview-grid";
import { PromptInputSection } from "../components/home/prompt-input-section";
import { ErrorDisplay } from "../components/home/error-display";
import { ResultDisplay } from "../components/home/result-display";

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

        const selectedFiles = Array.from(files).slice(0, 5);
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
            <div className="max-w-6xl mx-auto">
                <PageHeader />

                {!response ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <ImageUploadSection onImageChange={handleImageChange} disabled={loading} />

                        <ImagePreviewGrid previews={previews} onRemove={removeImage} disabled={loading} />

                        <PromptInputSection value={prompt} onChange={setPrompt} disabled={loading} />

                        {error && <ErrorDisplay error={error} screenshot={errorScreenshot} />}

                        <Button type="submit" size="lg" className="w-full" disabled={loading || images.length < 1 || images.length > 5 || !prompt.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating Image...
                                </>
                            ) : (
                                "Generate Image"
                            )}
                        </Button>
                    </form>
                ) : (
                    <ResultDisplay
                        response={response}
                        onGenerateAnother={() => {
                            setResponse(null);
                            setError(null);
                        }}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default Home;
