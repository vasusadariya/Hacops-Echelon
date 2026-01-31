'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  AlertCircle,
  X
} from 'lucide-react';

export function CameraCapture({ 
  onCapture, 
  onCancel,
  facingMode = 'user',
  mirrorVideo = true,
  showGuide = true
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Unable to access camera. Please try again.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && isReady) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      
      // Mirror the image if needed
      if (mirrorVideo) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      stopCamera();
      onCapture?.(dataUrl);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="outline" onClick={startCamera}>
            Try Again
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden max-w-sm mx-auto">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-auto ${mirrorVideo ? 'transform scale-x-[-1]' : ''}`}
        />
        
        {/* Face Guide Overlay */}
        {showGuide && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Oval face guide */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-52 border-2 border-dashed border-white/60 rounded-full" />
            
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60" />
            
            {/* Instructions */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                Position your face within the oval
              </span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-sm">Starting camera...</div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex gap-3 justify-center">
        <Button
          type="button"
          onClick={capturePhoto}
          className="bg-primary hover:bg-primary/90"
          disabled={!isReady}
        >
          <Camera className="h-4 w-4 mr-2" />
          Capture Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
      
      <Alert className="bg-muted border-muted-foreground/20">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Tips for a good selfie:</strong>
          <ul className="mt-1 list-disc list-inside text-muted-foreground">
            <li>Look directly at the camera</li>
            <li>Ensure good, even lighting on your face</li>
            <li>Keep your face within the oval outline</li>
            <li>Remove glasses if possible</li>
            <li>Keep a neutral expression</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}