import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useAuth } from "../contexts/AuthContext";

export default function Generate() {
    const [prompt, setPrompt] = useState("editkan gambar agar gambar ini menyatu dengan model menggunakan nano banana");
    const [images, setImages] = useState<string[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [videoPrompt, setVideoPrompt] = useState("make a 10 second video with this image");
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoResult, setVideoResult] = useState<string | null>(null);
    const { token, logout } = useAuth();

    useEffect(() => {
        if (!token) {
            route("/");
            return;
        }
    }, [token]);

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
            alert("Please provide prompt and 2 images.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ prompt, images: images.filter((i) => i) }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data.image);
            } else {
                alert("Generation failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error generating image");
        } finally {
            setLoading(false);
        }
    };

    const base64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(",");
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleGenerateVideo = async () => {
        if (!result || !videoPrompt) {
            alert("No image or prompt for video generation.");
            return;
        }
        setVideoLoading(true);
        try {
            const formData = new FormData();
            const imageFile = base64ToFile(result, "generated-image.png");
            formData.append("image", imageFile);
            formData.append("prompt", videoPrompt);

            const res = await fetch("/api/generate-video", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setVideoResult(data.video);
            } else {
                alert("Video generation failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error generating video");
        } finally {
            setVideoLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        route("/");
    };

    return (
        <div class="flex items-center justify-center min-h-screen bg-gray-100">
            <div class="bg-white p-8 rounded shadow-md w-full max-w-2xl">
                <h2 class="text-2xl mb-4">Generate Image</h2>
                <form onSubmit={handleSubmit}>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">Prompt</label>
                        <textarea value={prompt} onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={3} required />
                    </div>
                    <div class="flex gap-4 mb-4">
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700">Image 1</label>
                            <input type="file" accept="image/*" onChange={handleFileChange1} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700">Image 2</label>
                            <input type="file" accept="image/*" onChange={handleFileChange2} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                    </div>
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
                {result && (
                    <div class="mt-4">
                        <h3 class="text-lg">Generated Image</h3>
                        <img src={result} alt="Generated" class="w-full mt-2" />
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700">Video Prompt</label>
                            <textarea value={videoPrompt} onInput={(e) => setVideoPrompt((e.target as HTMLTextAreaElement).value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={2} />
                        </div>
                        <button onClick={handleGenerateVideo} disabled={videoLoading} class="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50">
                            {videoLoading ? "Generating Video..." : "Generate Video"}
                        </button>
                    </div>
                )}
                {videoResult && (
                    <div class="mt-4">
                        <h3 class="text-lg">Generated Video</h3>
                        <video src={videoResult} controls class="w-full mt-2" />
                    </div>
                )}
                <button onClick={handleLogout} class="mt-4 bg-red-500 text-white p-2 rounded w-full">
                    Logout
                </button>
            </div>
        </div>
    );
}
