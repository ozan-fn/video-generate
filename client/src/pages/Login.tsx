import { useEffect, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Chrome } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface LoginResponse {
    platform: string;
    isLoggedIn: boolean;
    message: string;
    profileFound: boolean;
    details: {
        selector: string;
        elementFound: boolean;
        timestamp: string;
        action?: string;
    };
}

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState<{
        success: boolean;
        message: string;
        isLoggedIn: boolean;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [socketStatus, setSocketStatus] = useState<"connected" | "disconnected">("disconnected");
    const [socketId, setSocketId] = useState<string | null>(null);
    const socketRef = useRef<Socket>(null);
    const [form, setForm] = useState({ email: "", password: "" });
    const [screenshot, setScreenshot] = useState<string>("");

    useEffect(() => {
        const isProd = import.meta.env.MODE === "production";
        const socketUrl = isProd ? "/" : "http://localhost:3001";
        const socket: Socket = io(socketUrl);
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketStatus("connected");
            setSocketId(socket.id ?? null);
        });

        socket.on("disconnect", () => {
            setSocketStatus("disconnected");
            setSocketId(null);
        });

        socket.on("screenshot", (msg) => {
            setScreenshot(msg);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const handleLogin = async () => {
        const socket = socketRef.current;

        socket?.emit("login", atob("b3phbjY4MjUxQGdtYWlsLmNvbXxBa2htYWQ2ODI1"));
    };

    const handleCheckGeminiLogin = async () => {
        setError(null);
        setLoginStatus(null);
        setLoading(true);

        try {
            const response = await fetch("/api/check-login?platform=gemini");
            const data: LoginResponse = await response.json();

            if (response.ok) {
                setLoginStatus({
                    success: true,
                    message: data.message,
                    isLoggedIn: data.isLoggedIn,
                });
            } else {
                setError(data.details?.action || "Failed to check login");
                setLoginStatus({
                    success: false,
                    message: data.message,
                    isLoggedIn: false,
                });
            }
        } catch (err) {
            setError("Failed to connect to server. Please try again.");
            console.error("Check login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="max-w-7xl w-full">
                    {screenshot && (
                        <div className="mb-6 flex justify-center">
                            <img src={`data:image/webp;base64,${screenshot}`} alt="Gemini Screenshot" className="border border-border rounded-md shadow-md max-h-96" />
                        </div>
                    )}
                </div>
                <div className="w-full max-w-md">
                    <div className="bg-card border border-border rounded-lg shadow-lg p-8">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full">
                                <Chrome className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold mb-2 text-center">Login Check</h1>
                        <p className="text-muted-foreground text-center mb-8">Check your Gemini login status</p>

                        <div className="space-y-4">
                            {/* Socket Status */}
                            <div className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${socketStatus === "connected" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}`}>
                                <span>Socket: {socketStatus === "connected" ? "Connected" : "Disconnected"}</span>
                                <span className="text-xs opacity-75">{socketId ? `ID: ${socketId}` : "No ID"}</span>
                            </div>
                            {/* Gemini Check Button */}
                            <Button onClick={handleCheckGeminiLogin} disabled={loading} className="w-full h-12 text-base font-medium">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Checking Gemini Login...
                                    </>
                                ) : (
                                    <>
                                        <Chrome className="mr-2 h-5 w-5" />
                                        Check Gemini Login
                                    </>
                                )}
                            </Button>

                            {/* Gemini Login Button */}
                            <Button variant="outline" onClick={() => handleLogin()} className="w-full h-12 text-base font-medium">
                                <Chrome className="mr-2 h-5 w-5" />
                                Login Gemini (Open Tab)
                            </Button>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Login Check Failed</p>
                                        <p className="mt-1 text-xs">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            {loginStatus && (
                                <div className={`flex items-start gap-3 p-4 rounded-md text-sm ${loginStatus.isLoggedIn ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400"}`}>
                                    {loginStatus.isLoggedIn ? <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                                    <div>
                                        <p className="font-medium">{loginStatus.message}</p>
                                        <p className="text-xs mt-1 opacity-75">{loginStatus.isLoggedIn ? "Your Gemini session is active" : "Please login to Gemini first"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">How it works:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>✓ Opens Gemini in the background</li>
                                <li>✓ Checks for login profile element</li>
                                <li>✓ Returns your login status</li>
                            </ul>
                        </div>

                        <p className="text-center text-muted-foreground text-xs mt-6">Make sure you are logged into Google/Gemini in your browser</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Login;
