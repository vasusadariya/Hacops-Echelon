'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  X, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  User
} from 'lucide-react';

const CAPTURE_STEPS = [
  { id: 'front', label: 'Look Straight', instruction: 'Look directly at the camera', icon: User },
  { id: 'left', label: 'Turn Left', instruction: 'Slowly turn your head to the LEFT', icon: ChevronLeft },
  { id: 'right', label: 'Turn Right', instruction: 'Slowly turn your head to the RIGHT', icon: ChevronRight },
  { id: 'up', label: 'Look Up', instruction: 'Slowly tilt your head UP', icon: ChevronUp }
];

export function MultiAngleFaceCapture({ onCaptureComplete, onRemove, initialCaptures = null }) {
  // State
  const [mode, setMode] = useState('idle'); // idle | capturing | review
  const [cameraReady, setCameraReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState({
    front: initialCaptures?.front || null,
    left: initialCaptures?.left || null,
    right: initialCaptures?.right || null,
    up: initialCaptures?.up || null
  });
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [hasNotifiedParent, setHasNotifiedParent] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const countdownRef = useRef(null);
  const onCaptureCompleteRef = useRef(onCaptureComplete);
  const onRemoveRef = useRef(onRemove);

  // Update refs when callbacks change
  useEffect(() => {
    onCaptureCompleteRef.current = onCaptureComplete;
  }, [onCaptureComplete]);

  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);

  // Derived state
  const allCaptured = Boolean(captures.front && captures.left && captures.right && captures.up);
  const capturedCount = [captures.front, captures.left, captures.right, captures.up].filter(Boolean).length;
  
  // Safe current step (always within bounds)
  const safeCurrentStep = Math.min(Math.max(0, currentStep), CAPTURE_STEPS.length - 1);
  const currentStepData = CAPTURE_STEPS[safeCurrentStep];
  const CurrentIcon = currentStepData?.icon || User;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // Check if initial captures exist and set review mode
  useEffect(() => {
    if (initialCaptures) {
      const hasAll = initialCaptures.front && initialCaptures.left && initialCaptures.right && initialCaptures.up;
      if (hasAll) {
        setMode('review');
        setHasNotifiedParent(true);
      }
    }
  }, []); // Only run once on mount

  // Notify parent when all captures are done (only once)
  useEffect(() => {
    if (allCaptured && !hasNotifiedParent) {
      setHasNotifiedParent(true);
      if (onCaptureCompleteRef.current) {
        onCaptureCompleteRef.current(captures);
      }
    }
  }, [allCaptured, hasNotifiedParent, captures]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCountdown(null);
  }, []);

  const startCamera = useCallback(async () => {
    console.log('Starting camera...');
    setError('');
    setMode('capturing');
    setCameraReady(false);

    // Stop any existing stream
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      console.log('Got camera stream');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
          setCameraReady(true);
        };

        try {
          await videoRef.current.play();
          console.log('Video playing');
        } catch (playErr) {
          console.log('Autoplay blocked, trying muted...');
          videoRef.current.muted = true;
          await videoRef.current.play();
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setMode('idle');
      stopCamera();
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is in use by another app.');
      } else {
        setError(err.message || 'Failed to start camera');
      }
    }
  }, [stopCamera]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const handleCapture = useCallback((image) => {
    if (!image) return;

    const stepId = CAPTURE_STEPS[safeCurrentStep].id;
    
    setCaptures(prev => {
      const newCaptures = { ...prev, [stepId]: image };
      return newCaptures;
    });

    if (safeCurrentStep < 3) {
      setCurrentStep(safeCurrentStep + 1);
    } else {
      stopCamera();
      setMode('review');
    }
  }, [safeCurrentStep, stopCamera]);

  const captureWithCountdown = useCallback(() => {
    if (countdown !== null) return;
    
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          
          const image = captureFrame();
          if (image) {
            handleCapture(image);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [countdown, captureFrame, handleCapture]);

  const captureNow = useCallback(() => {
    const image = captureFrame();
    if (image) {
      handleCapture(image);
    }
  }, [captureFrame, handleCapture]);

  const retakeOne = useCallback((stepId) => {
    const stepIndex = CAPTURE_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex >= 0) {
      setCaptures(prev => ({ ...prev, [stepId]: null }));
      setCurrentStep(stepIndex);
      setHasNotifiedParent(false);
      startCamera();
    }
  }, [startCamera]);

  const retakeAll = useCallback(() => {
    stopCamera();
    setCaptures({ front: null, left: null, right: null, up: null });
    setCurrentStep(0);
    setMode('idle');
    setHasNotifiedParent(false);
    if (onRemoveRef.current) {
      onRemoveRef.current();
    }
  }, [stopCamera]);

  const cancelCapture = useCallback(() => {
    stopCamera();
    setMode('idle');
    setCurrentStep(0);
  }, [stopCamera]);

  const goToStep = useCallback((idx) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCurrentStep(idx);
    setCountdown(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Video element - ALWAYS in DOM */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: mode === 'capturing' ? 'block' : 'none',
          width: '100%',
          maxWidth: '500px',
          borderRadius: '12px',
          transform: 'scaleX(-1)',
          backgroundColor: '#000',
          margin: '0 auto'
        }}
      />

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute -top-12 right-0 text-white" 
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img src={previewImage.url} alt={previewImage.label} className="w-full rounded-lg" />
            <p className="text-center text-white mt-3">{previewImage.label}</p>
          </div>
        </div>
      )}

      {/* ========== IDLE MODE ========== */}
      {mode === 'idle' && !allCaptured && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-linear-to-b from-orange-50 to-white">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Multi-Angle Face Capture</h3>
          <p className="text-gray-600 mb-6">
            We'll capture 4 photos of your face from different angles
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center gap-3 mb-6">
            {CAPTURE_STEPS.map((step) => {
              const Icon = step.icon;
              const done = !!captures[step.id];
              return (
                <div key={step.id} className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {step.id.charAt(0).toUpperCase() + step.id.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>

          <Button onClick={startCamera} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Camera className="h-4 w-4 mr-2" />
            Start Capture
          </Button>

          {error && (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ========== CAPTURING MODE ========== */}
      {mode === 'capturing' && currentStepData && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">
              Step {safeCurrentStep + 1} of 4: {currentStepData.label}
            </span>
            <span className="text-gray-500">{capturedCount}/4 captured</span>
          </div>
          <Progress value={(capturedCount / 4) * 100} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {CAPTURE_STEPS.map((step, idx) => {
              const done = !!captures[step.id];
              const active = idx === safeCurrentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-orange-500 text-white ring-4 ring-orange-200' :
                    'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {done ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                </button>
              );
            })}
          </div>

          {/* Instruction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <CurrentIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-blue-800">{currentStepData.instruction}</p>
          </div>

          {/* Camera overlay */}
          {cameraReady && (
            <div className="relative" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ aspectRatio: '4/3' }}>
                {/* Face oval */}
                <div 
                  className="absolute border-2 border-dashed border-white/70 rounded-full"
                  style={{ width: '45%', height: '65%', top: '15%', left: '27.5%' }} 
                />
                
                {/* Direction indicator */}
                {currentStepData.id !== 'front' && (
                  <div className={`absolute ${
                    currentStepData.id === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
                    currentStepData.id === 'right' ? 'right-2 top-1/2 -translate-y-1/2' :
                    'top-2 left-1/2 -translate-x-1/2'
                  }`}>
                    <div className="bg-orange-500 text-white p-2 rounded-full animate-pulse">
                      <CurrentIcon className="h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Countdown overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                    <span className="text-7xl font-bold text-white">{countdown}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {!cameraReady && (
            <div className="text-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="text-gray-600">Starting camera...</p>
            </div>
          )}

          {/* Capture buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              type="button"
              onClick={captureWithCountdown}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!cameraReady || countdown !== null}
            >
              {countdown !== null ? (
                `Capturing in ${countdown}...`
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" /> Capture (3s)
                </>
              )}
            </Button>
            <Button 
              type="button"
              onClick={captureNow} 
              variant="outline" 
              disabled={!cameraReady || countdown !== null}
            >
              Capture Now
            </Button>
            <Button type="button" onClick={cancelCapture} variant="ghost">
              Cancel
            </Button>
          </div>

          {/* Captured thumbnails */}
          {capturedCount > 0 && (
            <div className="flex justify-center gap-2 pt-4 border-t">
              {CAPTURE_STEPS.map(step => {
                const img = captures[step.id];
                if (!img) return null;
                return (
                  <div key={step.id} className="relative group">
                    <img
                      src={img}
                      alt={step.label}
                      className="w-14 h-14 object-cover rounded-lg border-2 border-green-500 cursor-pointer"
                      onClick={() => setPreviewImage({ url: img, label: step.label })}
                    />
                    <button
                      type="button"
                      onClick={() => retakeOne(step.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* ========== REVIEW MODE ========== */}
      {(mode === 'review' || allCaptured) && allCaptured && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-green-800">All 4 Photos Captured!</h4>
            <p className="text-green-600 text-sm">Review your photos below</p>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CAPTURE_STEPS.map(step => {
              const img = captures[step.id];
              if (!img) return null;
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative group">
                  <div 
                    className="aspect-3/4 rounded-lg overflow-hidden border-2 border-green-500 shadow-md cursor-pointer"
                    onClick={() => setPreviewImage({ url: img, label: step.label })}
                  >
                    <img 
                      src={img} 
                      alt={step.label} 
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                    />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                    <div className="flex items-center justify-center gap-1 text-white text-xs">
                      <Icon className="h-3 w-3" /> 
                      {step.id.charAt(0).toUpperCase() + step.id.slice(1)}
                    </div>
                  </div>
                  <Badge className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1">
                    <CheckCircle className="h-3 w-3" />
                  </Badge>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); retakeOne(step.id); }}
                    className="absolute top-1 left-1 bg-white/90 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <RotateCcw className="h-3 w-3 text-gray-700" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Button type="button" variant="outline" onClick={retakeAll}>
              <RotateCcw className="h-4 w-4 mr-2" /> Retake All Photos
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Click any photo to view full size • Hover to retake
          </p>
        </div>
      )}
    </div>
  );
}