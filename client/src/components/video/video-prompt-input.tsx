import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";

interface VideoPromptInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}

export const VideoPromptInput = ({ value, onChange, disabled }: VideoPromptInputProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Prompt</CardTitle>
                <CardDescription>Describe what video you want to create</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Example: A magical forest with glowing trees transforming into a night sky..." className="min-h-40" disabled={disabled} />
            </CardContent>
        </Card>
    );
};
