import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";

interface ARCameraProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export interface ARCameraHandle {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export const ARCamera = forwardRef<ARCameraHandle, ARCameraProps>(
  ({ onStreamReady, onError, children }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const startCamera = async () => {
      try {
        setError(null);
        // Request rear-facing camera
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setStream(mediaStream);
        setIsInitialized(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        if (onStreamReady) {
          onStreamReady(mediaStream);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        const errorMessage = err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Failed to access camera. Please check your device settings.";
        setError(errorMessage);
        toast.error(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
        throw err;
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setIsInitialized(false);
      }
    };

    useImperativeHandle(ref, () => ({
      startCamera,
      stopCamera,
    }));

    useEffect(() => {
      return () => {
        // Clean up camera stream on unmount
        stopCamera();
      };
    }, [stream]);

    return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
        {/* FIX #4: Video feed with lower z-index to not block canvas touches */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          autoPlay
          playsInline
          muted
        />
        
        {/* Overlay content (game canvas, UI, etc.) */}
        {children}
      </div>
    );
  }
);
