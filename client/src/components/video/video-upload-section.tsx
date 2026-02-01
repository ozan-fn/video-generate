import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Upload } from "lucide-react";

interface VideoUploadSectionProps {
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
}

export const VideoUploadSection = ({ onImageChange, disabled }: VideoUploadSectionProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Images</CardTitle>
                <CardDescription>Select between 1 and 5 images (JPG, PNG, GIF, or WebP)</CardDescription>
            </CardHeader>
            <CardContent>
                <Label className="flex flex-col items-center justify-center w-full p-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:border-primary">
                    <div className="flex flex-col items-center gap-3">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                            <p className="font-semibold text-foreground">Click to upload images</p>
                            <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                        </div>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={onImageChange} className="hidden" disabled={disabled} />
                </Label>
            </CardContent>
        </Card>
    );
};
