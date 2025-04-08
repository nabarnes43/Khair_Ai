import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';

/**
 * Props for the CameraDialog component
 */
interface CameraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
}

/**
 * Camera component that provides webcam functionality
 * Uses a Card component to create a dialog-like interface
 */
export function CameraDialog({ isOpen, onClose, onCapture }: CameraDialogProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCaptureEnabled, setCaptureEnabled] = useState(true);

  // Handle image capture
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      onClose();
    }
  }, [webcamRef, onCapture, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="bg-background w-full max-w-md mx-auto ">
        <CardHeader className="relative">
          <CardTitle>Take a Photo</CardTitle>
          <Button 
            className="absolute right-4 top-4 border-none" 
            variant="outline" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="relative bg-background border-2 border-foreground rounded-lg overflow-hidden aspect-square">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "user",
                width: { min: 480 },
                height: { min: 480 },
              }}
              onUserMedia={() => setCaptureEnabled(true)}
              onUserMediaError={() => setCaptureEnabled(false)}
              className="w-full h-full object-cover"
            />
            
            {/* Face positioning guide overlay */}
            {isCaptureEnabled && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Oval face outline */}
                <div className="w-[70%] h-[90%] border-2 border-white/70 rounded-full"></div>
                
                {/* Positioning instructions */}
                <div className="absolute bottom-4 left-0 right-0 text-center bg-black/40 text-white p-2 text-sm">
                  Position your face within the outline and use the best lighting
                </div>
              </div>
            )}
            
            {!isCaptureEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                <p className="text-center p-4">
                  Camera access denied or not available.
                  <br />
                  Please allow camera access to use this feature.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={capture} disabled={!isCaptureEnabled}>
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 