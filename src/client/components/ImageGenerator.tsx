import { useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";

interface ImageGeneratorProps {
    onImageGenerated: (image: string) => void;
}

export default function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState("editkan gambar agar gambar ini menyatu dengan model menggunakan nano banana");
    const [images, setImages] = useState<string[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const { token } = useAuth();

    const handleFileChange1 = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setImages((prev) => [base64, prev[1] || ""]);
            setPreviews((prev) => [base64, prev[1] || ""]);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange2 = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setImages((prev) => [prev[0] || "", base64]);
            setPreviews((prev) => [prev[0] || "", base64]);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!prompt || images.filter((i) => i).length < 2) {
            setError("Please provide prompt and 2 images.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt, images: images.filter((i) => i) }),
            });
            const data = await res.json();
            if (res.ok) {
                onImageGenerated(data.image);
                setScreenshot(null);\n            } else {\n                setError(data.error || \"Generation failed\");\n                setScreenshot(data.screenshot || null);\n            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error generating image";
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 class="text-2xl mb-4">Generate Image</h2>
            <form onSubmit={handleSubmit}>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Prompt</label>
                    <textarea value={prompt} onInput={(e: Event) => setPrompt((e.target as HTMLTextAreaElement).value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={3} required />
                </div>
                <div class="flex gap-4 mb-4">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700">Image 1</label>
                        <input type="file" accept="image/*" onChange={(e: Event) => handleFileChange1(e)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700">Image 2</label>
                        <input type="file" accept="image/*" onChange={(e: Event) => handleFileChange2(e)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                </div>
                {error && <div class="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                {previews.some((p) => p) && (
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">Preview</label>
                        <div class="flex gap-2 mt-2">{previews.map((src, index) => src && <img key={index} src={src} alt={`Preview ${index + 1}`} class="w-20 h-20 object-cover rounded" />)}</div>
                    </div>
                )}
                <button type="submit" disabled={loading} class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50">
                    {loading ? "Generating..." : "Generate"}
                </button>
            </form>
            {screenshot && (
                <div class="mt-4 p-4 bg-blue-50 rounded">
                    <h3 class="text-lg font-semibold mb-2">Screenshot saat error</h3>
                    <img src={screenshot} alt="Screenshot" class="w-full rounded border border-blue-200" />
                </div>
            )}
        </div>
    );
}
