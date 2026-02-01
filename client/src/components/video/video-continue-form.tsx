import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2, Repeat } from "lucide-react";
import { VideoErrorDisplay } from "./video-error-display";

interface VideoContinueFormProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string | null;
}

export const VideoContinueForm = ({ prompt, onPromptChange, onSubmit, loading, error }: VideoContinueFormProps) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Continue the Video</CardTitle>
                    <CardDescription>Describe how to continue the video (in English)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea value={prompt} onChange={(e) => onPromptChange(e.target.value)} placeholder="Example: The camera zooms out, revealing the city at sunset..." className="min-h-32" disabled={loading} />
                </CardContent>
            </Card>

            {error && <VideoErrorDisplay error={error} />}

            <Button type="submit" size="lg" className="w-full" disabled={loading || !prompt.trim()}>
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Repeat className="h-4 w-4 mr-2" />
                        Continue Generation
                    </>
                )}
            </Button>
        </form>
    );
};
