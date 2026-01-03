import { useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";

interface VideoGeneratorProps {
    image: string;
}

export default function VideoGenerator({ image }: VideoGeneratorProps) {
    const [videoPrompt, setVideoPrompt] = useState("make a 10 second video with this image");
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoResult, setVideoResult] = useState<string | null>(null);
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
            alert("No image or prompt for video generation.");
            return;
        }
        setVideoLoading(true);
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

    return (
        <div class="mt-4">
            <h3 class="text-lg">Generate Video from Image</h3>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700">Video Prompt</label>
                <textarea value={videoPrompt} onInput={(e: Event) => setVideoPrompt((e.target as HTMLTextAreaElement).value)} class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={2} />
            </div>
            <button onClick={handleGenerateVideo} disabled={videoLoading} class="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50">
                {videoLoading ? "Generating Video..." : "Generate Video"}
            </button>
            {videoResult && (
                <div class="mt-4">
                    <h4 class="text-md">Generated Video</h4>
                    <video src={videoResult} controls class="w-full mt-2" />
                </div>
            )}
        </div>
    );
}
