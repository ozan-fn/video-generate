import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, token } = useAuth();

    useEffect(() => {
        if (token) {
            route("/generate");
        }
    }, [token]);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const data = await res.json();
                login(data.token);
                route("/generate");
            } else {
                alert("Login failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded shadow-md w-96">
                <h2 class="text-2xl mb-4">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Username</label>
                        <input type="text" value={username} onInput={(e: Event) => setUsername((e.target as HTMLInputElement).value)} class="w-full p-2 border rounded" required disabled={loading} />
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Password</label>
                        <input type="password" value={password} onInput={(e: Event) => setPassword((e.target as HTMLInputElement).value)} class="w-full p-2 border rounded" required disabled={loading} />
                    </div>
                    <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
