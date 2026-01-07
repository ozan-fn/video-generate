import { type JSX } from "preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
    children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token } = useAuth();

    useEffect(() => {
        if (!token || !isTokenValid(token)) {
            route("/");
        }
    }, [token]);

    if (!token || !isTokenValid(token)) {
        return null;
    }

    return <>{children}</>;
}

function isTokenValid(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp > Date.now() / 1000;
    } catch {
        return false;
    }
}
