import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle } from "lucide-react";

export const VideoSuccessBanner = () => {
    return (
        <Card className="border-green-200/70 bg-green-50/50 dark:bg-green-950/40">
            <CardHeader className="flex flex-row items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                    <CardTitle>Success!</CardTitle>
                    <CardDescription>Your video has been generated</CardDescription>
                </div>
            </CardHeader>
        </Card>
    );
};
