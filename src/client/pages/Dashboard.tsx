import { route } from "preact-router";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Dashboard() {
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
                        <h1 class="text-2xl">Dashboard</h1>
                        <button onClick={handleLogout} class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                    <div class="mb-4">
                        <p>Welcome to your dashboard!</p>
                        <button onClick={() => route("/generate")} class="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                            Go to Generate
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
