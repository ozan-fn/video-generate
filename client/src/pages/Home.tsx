import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Button } from '../components/ui/button';
import { Upload, X } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files).slice(0, 2); // Max 2 images
    setImages(selectedFiles);

    // Create previews
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length !== 2) {
      alert('Please select exactly 2 images');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append('images', image);
      });
      formData.append('prompt', prompt);

      const result = await axios.post('/api/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponse(result.data);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate Video</h1>
          <p className="text-muted-foreground">
            Upload 2 images and enter a prompt to generate your video.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select exactly 2 images (JPG, PNG, GIF, or WebP)
              </p>

              <div className="space-y-4">
                {/* Upload Button */}
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload images
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={loading}
                  />
                </label>

                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Prompt</h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create..."
                className="w-full min-h-32 px-3 py-2 rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || images.length !== 2 || !prompt.trim()}
            >
              {loading ? 'Generating...' : 'Generate Video'}
            </Button>
          </form>

          {/* Response Display */}
          {response && (
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Response</h2>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
