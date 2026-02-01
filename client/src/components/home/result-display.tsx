import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";

interface GenerateResponse {
    message: string;
    image: string;
    images: Array<{ name: string; size: number }>;
}

interface ResultDisplayProps {
    response: GenerateResponse;
    onGenerateAnother: () => void;
}

export const ResultDisplay = ({ response, onGenerateAnother }: ResultDisplayProps) => {
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = response.image;
        link.download = `generated-image-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Success Message */}
            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 p-6 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-green-900 dark:text-green-100">Success!</h3>
                    <p className="text-sm text-green-800 dark:text-green-200">Your image has been generated</p>
                </div>
            </div>

            {/* Generated Image */}
            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                    <h2 className="text-2xl font-bold">Generated Image</h2>
                </div>
                <img src={response.image} alt="Generated" className="w-full h-auto" />
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-border bg-card shadow-lg p-6">
                <h3 className="font-bold mb-3">Details</h3>
                <div className="space-y-2 text-sm">
                    <p>
                        <span className="font-semibold">Status:</span> {response.message}
                    </p>
                    <p>
                        <span className="font-semibold">Images Processed:</span> {response.images.length}
                    </p>
                    {response.images.map((img, idx) => (
                        <p key={idx} className="text-muted-foreground">
                            • {img.name} ({(img.size / 1024).toFixed(2)} KB)
                        </p>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button onClick={onGenerateAnother} size="lg" className="flex-1 rounded-lg">
                    Generate Another
                </Button>
                <Button onClick={handleDownload} variant="outline" size="lg" className="flex-1 rounded-lg">
                    Download Image
                </Button>
            </div>
        </div>
    );
};
