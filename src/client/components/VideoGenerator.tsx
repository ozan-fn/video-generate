import { useState } from "preact/hooks";
import { h } from "preact";
import { useAuth } from "../contexts/AuthContext";

interface VideoGeneratorProps {
    image: string;
}

export default function VideoGenerator({ image }: VideoGeneratorProps): h.JSX.Element {
    const [videoPrompt, setVideoPrompt] = useState("make a 10 second video with this image");
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoResult, setVideoResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const { token } = useAuth();

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
        if (!image || !videoPrompt) {
            setError("No image or prompt for video generation.");
            return;
        }
        setVideoLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            const imageFile = base64ToFile(image, "generated-image.png");
            formData.append("image", imageFile);
            formData.append("prompt", videoPrompt);

            const res = await fetch("/api/generate-video", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setVideoResult(data.video);
                setScreenshot(null);
            } else {
                setError(data.error || "Video generation failed");
                setScreenshot(data.screenshot || null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error generating video";
            setError(errorMessage);
            console.error(err);
        } finally {
            setVideoLoading(false);
        }
    };

    return (
        <div class="mt-4">
            <h3 class="text-lg">Generate Video from Image</h3>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700">Video Prompt</label>
                <textarea value={videoPrompt} onInput={(e: Event) => setVideoPrompt((e.target as HTMLTextAreaElement).value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={2} />
            </div>
            {error && <div class="mt-2 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
            <button onClick={handleGenerateVideo} disabled={videoLoading} class="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50">
                {videoLoading ? "Generating Video..." : "Generate Video"}
            </button>
            {videoResult && (
                <div class="mt-4">
                    <h4 class="text-md">Generated Video</h4>
                    <video src={videoResult} controls class="w-full mt-2" />
                </div>
            )}
            {screenshot && (
                <div class="mt-4 p-4 bg-blue-50 rounded">
                    <h3 class="text-lg font-semibold mb-2">Screenshot saat error</h3>
                    <img src={screenshot} alt="Screenshot" class="w-full rounded border border-blue-200" />
                </div>
            )}
        </div>
    );
}
