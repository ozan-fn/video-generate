import { Button } from "../ui/button";
import { X } from "lucide-react";

interface ImagePreviewGridProps {
    previews: string[];
    onRemove: (index: number) => void;
    disabled: boolean;
}

export const ImagePreviewGrid = ({ previews, onRemove, disabled }: ImagePreviewGridProps) => {
    if (previews.length === 0) return null;

    return (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
                <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" size="sm" variant="destructive" onClick={() => onRemove(index)} disabled={disabled} className="rounded-lg">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Image {index + 1}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
