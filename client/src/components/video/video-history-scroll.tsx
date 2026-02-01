import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Video as VideoIcon } from "lucide-react";

interface VideoItem {
    videoUrl: string;
}

interface VideoHistoryScrollProps {
    history: VideoItem[];
}

export const VideoHistoryScroll = ({ history }: VideoHistoryScrollProps) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <VideoIcon className="h-5 w-5" />
                    <CardTitle>Generated Videos</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4">
                        {history.map((item, index) => (
                            <div key={`${item.videoUrl}-${index}`} className="min-w-[240px] w-[240px] rounded-lg border border-border bg-background overflow-hidden">
                                <video controls className="w-full h-40 object-cover" src={item.videoUrl} />
                                <div className="p-3 text-xs text-muted-foreground">Video {index + 1}</div>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
