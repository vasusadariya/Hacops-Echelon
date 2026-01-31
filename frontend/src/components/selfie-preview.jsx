'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ZoomIn, 
  RotateCcw, 
  X,
  Camera
} from 'lucide-react';

export function SelfiePreview({ 
  selfiePreview, 
  onRetake, 
  onRemove,
  showActions = true 
}) {
  const [showModal, setShowModal] = useState(false);

  if (!selfiePreview) return null;

  return (
    <>
      {/* Modal for full-size preview */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setShowModal(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img 
              src={selfiePreview} 
              alt="Selfie Full Preview" 
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <div className="text-center mt-4 space-y-2">
              <p className="text-white text-sm">
                Your captured selfie for verification
              </p>
              {showActions && (
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowModal(false);
                      onRetake?.();
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Card */}
      <div className="space-y-4">
        <div className="relative inline-block group">
          <img 
            src={selfiePreview} 
            alt="Selfie Preview" 
            className="w-full max-w-sm h-auto rounded-lg border-2 border-secondary shadow-lg cursor-pointer transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.01]"
            onClick={() => setShowModal(true)}
          />
          
          {/* Captured Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground shadow-md">
              <CheckCircle className="h-3 w-3 mr-1" />
              Captured
            </Badge>
          </div>
          
          {/* Zoom Button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-80 hover:opacity-100 shadow-md"
            onClick={() => setShowModal(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
        </div>
        
        <p className="text-sm text-muted-foreground">
          Click on the image to view full size. Make sure your face is clearly visible.
        </p>
        
        {showActions && (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onRetake}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Selfie
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        )}
      </div>
    </>
  );
}