'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  X, 
  RotateCcw, 
  ZoomIn, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export function BiometricSelfieCapture({ onSelfieCapture, onSelfieRemove, initialSelfie = '' }) {
  const [mode, setMode] = useState(initialSelfie ? 'preview' : 'idle');
  // modes: 'idle' | 'loading' | 'camera' | 'preview'
  
  const [selfieData, setSelfieData] = useState(initialSelfie);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

  // Sync initial selfie
  useEffect(() => {
    if (initialSelfie && !selfieData) {
      setSelfieData(initialSelfie);
      setMode('preview');
    }
  }, [initialSelfie]);

  const cleanupCamera = () => {
    console.log('Cleaning up camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    console.log('Starting camera...');
    setError('');
    setMode('loading');

    // Clean up any existing stream
    cleanupCamera();

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      console.log('Camera stream obtained:', stream.id);
      streamRef.current = stream;

      // Make sure video ref exists
      if (!videoRef.current) {
        console.error('Video ref is null!');
        throw new Error('Video element not ready');
      }

      // Set the stream to video element
      videoRef.current.srcObject = stream;

      // Set up event listeners BEFORE calling play
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
      };

      videoRef.current.oncanplay = () => {
        console.log('Video can play');
      };

      // Try to play the video
      console.log('Attempting to play video...');
      
      try {
        await videoRef.current.play();
        console.log('Video playing successfully!');
        setMode('camera');
      } catch (playError) {
        console.error('Play error:', playError);
        // Some browsers need user interaction - try muted
        videoRef.current.muted = true;
        await videoRef.current.play();
        console.log('Video playing (muted)');
        setMode('camera');
      }

    } catch (err) {
      console.error('Camera error:', err);
      cleanupCamera();
      setMode('idle');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please allow camera permission in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another application. Please close it and try again.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not support required settings.');
      } else if (err.name === 'SecurityError') {
        setError('Camera access is blocked due to security settings.');
      } else {
        setError(err.message || 'Failed to access camera');
      }
    }
  };

  const capturePhoto = () => {
    console.log('Capturing photo...');
    
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight) {
      console.error('Video dimensions not ready:', video.videoWidth, video.videoHeight);
      setError('Video not ready. Please wait and try again.');
      return;
    }

    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mirror horizontally for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Get base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    console.log('Photo captured, length:', dataUrl.length);

    // Stop camera
    cleanupCamera();

    // Update state
    setSelfieData(dataUrl);
    setMode('preview');
    setError('');

    // Notify parent
    onSelfieCapture?.(dataUrl);
  };

  const cancelCamera = () => {
    console.log('Cancelling camera...');
    cleanupCamera();
    setMode('idle');
    setError('');
  };

  const retakeSelfie = () => {
    console.log('Retaking selfie...');
    setSelfieData('');
    setMode('idle');
    onSelfieRemove?.();
    // Start camera after short delay
    setTimeout(startCamera, 100);
  };

  const removeSelfie = () => {
    console.log('Removing selfie...');
    setSelfieData('');
    setMode('idle');
    onSelfieRemove?.();
  };

  // Debug log for mode changes
  useEffect(() => {
    console.log('Mode changed to:', mode);
  }, [mode]);

  return (
    <div className="space-y-4">
      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hidden video - always rendered but visibility controlled */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ 
          display: mode === 'camera' ? 'block' : 'none',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '8px',
          transform: 'scaleX(-1)',
          backgroundColor: '#000'
        }}
      />

      {/* Fullscreen Modal */}
      {showModal && selfieData && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-2xl w-full">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setShowModal(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={selfieData} alt="Selfie" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}

      {/* IDLE MODE */}
      {mode === 'idle' && !selfieData && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-gray-600 mb-4">
            Click below to open your camera and capture a selfie
          </p>
          <Button
            type="button"
            onClick={startCamera}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Camera className="h-4 w-4 mr-2" />
            Open Camera
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Your browser will ask for camera permission
          </p>
        </div>
      )}

      {/* LOADING MODE */}
      {mode === 'loading' && (
        <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-orange-50">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Starting camera...</p>
          <p className="text-sm text-gray-500 mt-1">Please allow camera access when prompted</p>
          <Button
            type="button"
            variant="outline"
            onClick={cancelCamera}
            className="mt-4"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* CAMERA MODE */}
      {mode === 'camera' && (
        <div className="space-y-4">
          {/* Camera view container */}
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxWidth: '500px' }}>
            {/* The video element is rendered above but we wrap it here for styling */}
            <div className="relative">
              {/* Video is displayed via the video element above */}
              
              {/* Face guide overlay */}
              <div 
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <div 
                  className="border-2 border-dashed border-white/70 rounded-full"
                  style={{ width: '180px', height: '220px' }}
                />
              </div>
              
              {/* Instruction text */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                  Position your face within the oval
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              onClick={capturePhoto}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={cancelCamera}
            >
              Cancel
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Tips:</strong> Look directly at the camera, ensure good lighting, remove glasses if possible.
          </div>
        </div>
      )}

      {/* PREVIEW MODE */}
      {(mode === 'preview' || selfieData) && selfieData && (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={selfieData}
              alt="Captured Selfie"
              className="max-w-full h-auto rounded-lg border-2 border-green-500 shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
              style={{ maxWidth: '400px' }}
              onClick={() => setShowModal(true)}
            />
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Captured
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8 bg-white/90 hover:bg-white shadow"
              onClick={() => setShowModal(true)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Click on the image to view full size
          </p>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={retakeSelfie}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Selfie
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={removeSelfie}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto ml-2 underline"
              onClick={startCamera}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}