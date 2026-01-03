import { Router, Route } from "preact-router";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Generate from "./pages/Generate";

export function App() {
    return (
        <AuthProvider>
            <div class="min-h-screen bg-gray-100">
                <Router>
                    <Route path="/" component={Login} />
                    <Route path="/generate" component={Generate} />
                </Router>
            </div>
        </AuthProvider>
    );
}
