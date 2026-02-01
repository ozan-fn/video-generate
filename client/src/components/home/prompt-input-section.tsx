interface PromptInputSectionProps {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}

export const PromptInputSection = ({ value, onChange, disabled }: PromptInputSectionProps) => {
    return (
        <div className="rounded-xl border border-border bg-card shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-2">Your Prompt</h2>
            <p className="text-muted-foreground mb-4">Describe what image you want to create</p>
            <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Example: A magical forest with glowing trees transforming into a night sky..." className="w-full min-h-40 px-4 py-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all" disabled={disabled} />
        </div>
    );
};
