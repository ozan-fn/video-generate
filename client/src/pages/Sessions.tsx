import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionsState } from '@/types/session';
import { Input } from '@/components/ui/input';

export default function Sessions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionsState>({
        sessionList: [],
        sessions: [],
    });
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
    });
    const [buttonTexts, setButtonTexts] = useState<Record<string, string>>({});
    const [isClicking, setIsClicking] = useState<Record<string, boolean>>({});

    const fetchSessions = async () => {
        try {
            const response = await axios('/api/session');
            setSessions({
                sessions: response.data.sessions,
                sessionList: response.data.sessionList,
            });
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const handleCreateChange = (field: 'password' | 'email', value: string) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            setIsCreating(true);
            await axios.post('/api/session', {
                email: createForm.email,
                password: createForm.password,
            });
            navigate('/sessions');
        } catch (error) {
            console.error('Error creating session:', error);
        } finally {
            setIsCreating(false);
        }
        setIsCreateOpen(false);
    };

    const handleButtonClick = async (id: string) => {
        const text = buttonTexts[id];
        if (!text) return;

        try {
            setIsClicking((prev) => ({ ...prev, [id]: true }));
            await axios.post(`/api/session/${id}/click`, {
                buttonText: text,
            });
            setButtonTexts((prev) => ({ ...prev, [id]: '' }));
            console.log(`Berhasil mengklik ${text} pada sesi ${id}`);
        } catch (error) {
            console.error('Gagal mengklik tombol:', error);
        } finally {
            setIsClicking((prev) => ({ ...prev, [id]: false }));
        }
    };

    // Fungsi tambahan untuk cek status sesi
    const handleCheckStatus = async (id: string) => {
        try {
            setIsClicking((prev) => ({ ...prev, [id]: true }));
            await axios.get(`/api/session/${id}/status`);
            await fetchSessions(); // Refresh data setelah cek
        } catch (error) {
            console.error('Gagal cek status sesi:', error);
        } finally {
            setIsClicking((prev) => ({ ...prev, [id]: false }));
        }
    };

    useEffect(() => {
        fetchSessions();
        const int = setInterval(() => {
            fetchSessions();
        }, 5000);
        return () => clearInterval(int);
    }, []);

    return (
        <>
            <MainLayout>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold mt-6">Session List</h1>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Create Session</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Session</DialogTitle>
                                <DialogDescription>Masukkan email dan password untuk membuat sesi baru.</DialogDescription>
                            </DialogHeader>
                            <form className="grid gap-4" onSubmit={handleCreateSubmit}>
                                <div className="grid gap-2">
                                    <Label htmlFor="session-email">Email</Label>
                                    <input id="session-email" name="email" type="email" placeholder="email@contoh.com" value={createForm.email} onChange={(event) => handleCreateChange('email', event.target.value)} className="border-input bg-transparent focus-visible:ring-ring/50 focus-visible:border-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="session-password">Password</Label>
                                    <input id="session-password" name="password" type="password" placeholder="Password" value={createForm.password} onChange={(event) => handleCreateChange('password', event.target.value)} className="border-input bg-transparent focus-visible:ring-ring/50 focus-visible:border-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]" required />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isCreating}>
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                                        {isCreating ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-3">
                    {sessions.sessionList.map((v, i) => {
                        const getStatusColor = (status: string) => {
                            switch (status) {
                                case 'valid':
                                    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                case 'invalid':
                                    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                                case 'pending':
                                    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                default:
                                    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
                            }
                        };

                        const getStatusLabel = (status: string) => {
                            switch (status) {
                                case 'valid':
                                    return 'Valid';
                                case 'invalid':
                                    return 'Invalid';
                                case 'pending':
                                    return 'Pending';
                                default:
                                    return status;
                            }
                        };

                        return (
                            <Card key={i} className="hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center justify-between gap-4 py-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">{v.id}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Tombol Cek Status Baru */}
                                        <Button variant="outline" size="sm" onClick={() => handleCheckStatus(v.id)} disabled={isClicking[v.id]}>
                                            {isClicking[v.id] ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Cek Status'}
                                        </Button>
                                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(v.status)}`}>{getStatusLabel(v.status)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {sessions.sessions.length === 0 ? (
                    <div className="flex mt-6 items-center justify-center rounded-lg border border-dashed p-12">
                        <p className="text-muted-foreground">Tidak ada session. Buat satu untuk memulai.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 mt-6">
                        {sessions.sessions.map((v, i) => {
                            const getStatusColor = (status: string) => {
                                switch (status) {
                                    case 'processing':
                                        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                                    case 'done':
                                        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                    case 'error':
                                        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                                    default:
                                        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
                                }
                            };

                            return (
                                <Card key={v.id || i} className="hover:shadow-md transition-shadow">
                                    <CardContent className="flex items-center justify-between gap-4 py-3">
                                        <div className="flex-1 min-w-[150px]">
                                            <p className="text-sm font-semibold text-foreground truncate">{v.id}</p>
                                        </div>
                                        <div className="flex flex-row items-center gap-3">
                                            <div className="flex w-full max-w-sm items-center space-x-2">
                                                <Input
                                                    placeholder="Teks tombol..."
                                                    value={buttonTexts[v.id] || ''}
                                                    onChange={(e) =>
                                                        setButtonTexts((prev) => ({
                                                            ...prev,
                                                            [v.id]: e.target.value,
                                                        }))
                                                    }
                                                    className="h-9 w-[180px]"
                                                    disabled={isClicking[v.id]}
                                                />
                                                <Button type="button" size="sm" variant="default" disabled={isClicking[v.id] || !buttonTexts[v.id]} onClick={() => handleButtonClick(v.id)} className="min-w-[60px]">
                                                    {isClicking[v.id] ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Klik'}
                                                </Button>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md min-w-[80px] text-center ${getStatusColor(v.status)}`}>{v.status}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </MainLayout>
        </>
    );
}
