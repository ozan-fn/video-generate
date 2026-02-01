import { useEffect, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
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
            <div className="container flex items-center justify-center min-h-[80vh]">
                <div className="w-full max-w-md space-y-6">
                    {screenshot && (
                        <div className="flex justify-center">
                            <img src={`data:image/webp;base64,${screenshot}`} alt="Gemini Screenshot" className="border rounded-md shadow-md max-h-96" />
                        </div>
                    )}

                    <div className="bg-card border rounded-lg shadow-lg p-6">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-full">
                                <Chrome className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-1">Login Check</h1>
                        <p className="text-muted-foreground text-center text-sm mb-6">Check your Gemini login status</p>

                        <div className="space-y-4">
                            {/* Socket Status */}
                            <div className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${socketStatus === "connected" ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}`}>
                                <span>Socket: {socketStatus === "connected" ? "Connected" : "Disconnected"}</span>
                                <span className="text-xs opacity-75">{socketId ? `ID: ${socketId}` : "No ID"}</span>
                            </div>
                            {/* Gemini Check Button */}
                            <Button onClick={handleCheckGeminiLogin} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Checking Gemini Login...
                                    </>
                                ) : (
                                    <>
                                        <Chrome className="mr-2 h-4 w-4" />
                                        Check Gemini Login
                                    </>
                                )}
                            </Button>

                            {/* Gemini Login Button */}
                            <Button variant="outline" onClick={() => handleLogin()} className="w-full">
                                <Chrome className="mr-2 h-4 w-4" />
                                Login Gemini (Open Tab)
                            </Button>

                            {/* Error Message */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Login Check Failed</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Status Message */}
                            {loginStatus && loginStatus.isLoggedIn && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>{loginStatus.message}</AlertTitle>
                                    <AlertDescription>Your Gemini session is active</AlertDescription>
                                </Alert>
                            )}

                            {loginStatus && !loginStatus.isLoggedIn && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>{loginStatus.message}</AlertTitle>
                                    <AlertDescription>Please login to Gemini first</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">How it works:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Opens Gemini in the background</li>
                                <li>• Checks for login profile element</li>
                                <li>• Returns your login status</li>
                            </ul>
                        </div>

                        <p className="text-center text-muted-foreground text-xs mt-4">Make sure you are logged into Google/Gemini in your browser</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Login;
