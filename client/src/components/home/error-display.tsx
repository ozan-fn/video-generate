import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
    error: string;
    screenshot?: string | null;
}

export const ErrorDisplay = ({ error, screenshot }: ErrorDisplayProps) => {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="space-y-3">
                <div>{error}</div>
                {screenshot && (
                    <div className="rounded-md overflow-hidden border border-destructive/50">
                        <img src={screenshot} alt="Error screenshot" className="w-full h-auto" />
                    </div>
                )}
            </AlertDescription>
        </Alert>
    );
};
