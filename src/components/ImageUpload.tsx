import React, { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  status: 'uploading' | 'ready' | 'processing' | 'error';
  progress: number;
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  resetKey?: number; // Add reset key to force reset
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesChange, 
  maxImages = 10, 
  maxSizeMB = 5,
  resetKey = 0
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset images when resetKey changes
  React.useEffect(() => {
    if (resetKey > 0) {
      images.forEach(img => URL.revokeObjectURL(img.url));
      setImages([]);
      onImagesChange([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return 'Only JPEG and PNG files are supported';
    }

    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<UploadedImage> => {
    const id = Math.random().toString(36).substring(7);
    const url = URL.createObjectURL(file);

    const uploadedImage: UploadedImage = {
      id,
      file,
      url,
      status: 'uploading',
      progress: 0
    };

    // Return immediately with uploading status
    // The progress will be updated via state in handleFiles
    return uploadedImage;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: UploadedImage[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }

      try {
        const uploadedImage = await processFile(file);
        newImages.push(uploadedImage);
      } catch (err) {
        console.error('Error processing file:', err);
      }
    }

    // Add new images with uploading status
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);

    // Simulate upload progress for each new image
    newImages.forEach((img) => {
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          // Update status to ready
          setImages(prevImages => {
            const updated = prevImages.map(image => 
              image.id === img.id 
                ? { ...image, progress: 100, status: 'ready' as const }
                : image
            );
            onImagesChange(updated);
            return updated;
          });
          clearInterval(progressInterval);
        } else {
          // Update progress
          setImages(prevImages => {
            const updated = prevImages.map(image => 
              image.id === img.id 
                ? { ...image, progress }
                : image
            );
            onImagesChange(updated);
            return updated;
          });
        }
      }, 200);
    });
  }, [images, maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.url);
        return false;
      }
      return true;
    });
    setImages(updatedImages);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-blue-200 hover:border-blue-300'
      }`}>
        <CardContent className="p-8">
          <div
            className="text-center space-y-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Colonoscopy Images
              </h3>
              <p className="text-gray-600">
                Drag and drop images here or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  JPEG/PNG
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  Max {maxSizeMB}MB
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  Up to {maxImages} images
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            <div className="text-xs text-gray-500">
              Images are processed locally and never leave your device
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Images ({images.length}/{maxImages})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="border-blue-100">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={image.url}
                        alt={image.file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 w-6 h-6 p-0"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      
                      {image.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-sm">Processing...</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 truncate" title={image.file.name}>
                          {image.file.name}
                        </span>
                        <Badge 
                          variant={
                            image.status === 'ready' ? 'default' :
                            image.status === 'processing' ? 'secondary' :
                            image.status === 'error' ? 'destructive' : 'outline'
                          }
                          className="ml-2"
                        >
                          {image.status === 'ready' ? 'Ready' :
                           image.status === 'processing' ? 'Processing' :
                           image.status === 'error' ? 'Error' : 'Uploading'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {formatFileSize(image.file.size)}
                      </div>

                      {image.status === 'uploading' && (
                        <Progress value={image.progress} className="h-2" />
                      )}

                      {image.status === 'error' && (
                        <div className="flex items-center space-x-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>Upload failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};