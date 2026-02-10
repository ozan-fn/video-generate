"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "~/components/ui/button";

interface Session {
    email: string;
    screenshot?: string;
    url?: string;
    title?: string;
    cookies?: string;
}

export function meta({}) {
    return [{ title: "Gemini Session Manager" }, { name: "description", content: "Manage Gemini login sessions" }];
}

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [selector, setSelector] = useState("");
    const [selectedEmail, setSelectedEmail] = useState("");

    // POST /api/session - Create new session
    const handleAddSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            alert("Email and password are required");
            return;
        }
        try {
            setLoading(true);
            await axios.post("/api/session", {
                email,
                passs: password,
            });
            alert(`Session creation started for ${email}`);
            setEmail("");
            setPassword("");
            await handleListSessions();
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to create session");
        } finally {
            setLoading(false);
        }
    };

    // GET /api/session - List all sessions
    const handleListSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/session");
            setSessions(response.data || []);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to fetch sessions");
        } finally {
            setLoading(false);
        }
    };

    // POST /api/session/click - Click element
    const handleClickElement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmail || !selector) {
            alert("Email and selector are required");
            return;
        }
        try {
            setLoading(true);
            await axios.post("/api/session/click", {
                email: selectedEmail,
                selector,
            });
            alert(`Clicked element: ${selector}`);
            setSelector("");
            await handleListSessions();
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to click element");
        } finally {
            setLoading(false);
        }
    };

    // DELETE /api/session - Delete session
    const handleDeleteSession = async (sessionEmail: string) => {
        if (!confirm(`Delete session: ${sessionEmail}?`)) return;
        try {
            setLoading(true);
            await axios.delete("/api/session", {
                params: { email: sessionEmail },
            });
            alert("Session deleted");
            await handleListSessions();
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete session");
        } finally {
            setLoading(false);
        }
    };

    // GET /api/session/check - Check session
    const handleCheckSession = async (sessionEmail: string) => {
        try {
            setLoading(true);
            const response = await axios.get("/api/session/check", {
                params: { email: sessionEmail },
            });
            alert(response.data.exists ? "Session is valid" : "Session is not valid");
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to check session");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Gemini Session Manager</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create Session Form */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Create Session</h2>
                        <form onSubmit={handleAddSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your-email@gmail.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your-password" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Creating..." : "Create Session"}
                            </Button>
                        </form>
                    </div>

                    {/* Click Element Form */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Click Element</h2>
                        <form onSubmit={handleClickElement} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Session</label>
                                <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- Choose Session --</option>
                                    {sessions.map((session) => (
                                        <option key={session.email} value={session.email}>
                                            {session.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">CSS Selector</label>
                                <input type="text" value={selector} onChange={(e) => setSelector(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="button.send, .submit, etc" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Clicking..." : "Click Element"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Active Sessions</h2>
                        <Button onClick={handleListSessions} disabled={loading}>
                            {loading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>

                    {sessions.length === 0 ? (
                        <p className="text-gray-500">No sessions found</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {sessions.map((session) => (
                                <div key={session.email} className="border border-gray-300 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold">{session.email}</h3>
                                            {session.title && <p className="text-sm text-gray-600">{session.title}</p>}
                                            {session.url && <p className="text-sm text-blue-600 truncate">{session.url}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleCheckSession(session.email)} disabled={loading}>
                                                Check
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.email)} disabled={loading}>
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    {session.screenshot && (
                                        <div className="mt-4">
                                            <img src={`data:image/png;base64,${session.screenshot}`} alt="Screenshot" className="w-full max-h-96 object-contain border border-gray-200 rounded" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
