import { useState } from "preact/hooks";
import { route } from "preact-router";
import { useAuth } from "../contexts/AuthContext";
import ImageGenerator from "../components/ImageGenerator";
import VideoGenerator from "../components/VideoGenerator";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Generate() {
    const [activeTab, setActiveTab] = useState<"image" | "video">("image");
    const [result, setResult] = useState<string | null>(null);
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        route("/");
    };

    return (
        <ProtectedRoute>
            <div class="flex items-center justify-center min-h-screen bg-gray-100">
                <div class="bg-white p-8 rounded shadow-md w-full max-w-2xl">
                    <div class="flex justify-between items-center mb-4">
                        <h1 class="text-2xl">Generate</h1>
                        <button onClick={handleLogout} class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                    <div class="mb-4">
                        <button onClick={() => setActiveTab("image")} class={`mr-2 px-4 py-2 rounded ${activeTab === "image" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                            Image to Video
                        </button>
                        <button onClick={() => setActiveTab("video")} class={`px-4 py-2 rounded ${activeTab === "video" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                            Video
                        </button>
                    </div>
                    {activeTab === "image" && (
                        <div>
                            <ImageGenerator onImageGenerated={setResult} />
                            {result && (
                                <div class="mt-4">
                                    <h3 class="text-lg">Generated Image</h3>
                                    <img src={result} alt="Generated" class="w-full mt-2" />
                                    <button onClick={() => setActiveTab("video")} class="mt-2 w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
                                        Lanjutkan ke Video
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === "video" && (
                        <div>
                            {result ? (
                                <VideoGenerator image={result} />
                            ) : (
                                <div>
                                    <h2 class="text-2xl mb-4">Generate Video from Video</h2>
                                    <form>
                                        <div class="mb-4">
                                            <label class="block text-sm font-medium text-gray-700">Prompt</label>
                                            <textarea class="mt-1 block w-full p-2 border border-gray-300 rounded-md" rows={3} />
                                        </div>
                                        <div class="mb-4">
                                            <label class="block text-sm font-medium text-gray-700">Video File</label>
                                            <input type="file" accept="video/*" class="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                                        </div>
                                        <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                                            Generate
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
