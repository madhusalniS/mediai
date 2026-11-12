import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Play,
  Square,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { DetectedFaceResult, RegisteredPerson, ZoneId } from '../types';
import { SAMPLE_IMAGES } from '../services/storage';
import { detectFaces, createHtmlImage } from '../services/faceApi';
import { HOSPITAL_ZONES } from '../constants/zones';

interface ScannerViewProps {
  registeredPersons: RegisteredPerson[];
  currentZone: ZoneId;
  onFaceDetected: (results: DetectedFaceResult[], zone: ZoneId) => void;
  onRegisterFace: (thumbnail?: string) => void;
  theme: 'dark' | 'light';
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  registeredPersons,
  currentZone,
  onFaceDetected,
  onRegisterFace,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<'upload' | 'webcam'>('upload');
  const [selectedSample, setSelectedSample] = useState<string>(SAMPLE_IMAGES[0].id);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(SAMPLE_IMAGES[0].path);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFaceResult[]>([]);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [useHighPrecision, setUseHighPrecision] = useState<boolean>(true);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [strictnessThreshold, setStrictnessThreshold] = useState<number>(0.46);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDetectingLoopRef = useRef<boolean>(false);

  // Active Zone metadata
  const zoneInfo = HOSPITAL_ZONES.find((z) => z.id === currentZone) || HOSPITAL_ZONES[0];

  /**
   * Draw the futuristic bounding boxes on canvas:
   * Glowing green for authorized (with name + role + confidence %)
   * Pulsing red for unknown ("Unknown – Verify")
   */
  const drawDetections = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      faces: DetectedFaceResult[],
      width: number,
      height: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      faces.forEach((face) => {
        const { box, isAuthorized, matchPerson, confidence } = face;
        const x = box.x;
        const y = box.y;
        const w = box.width;
        const h = box.height;
        const isSelected = selectedFaceId === face.id;

        // Colors
        const strokeColor = isAuthorized ? '#10B981' : '#EF4444';
        const shadowColor = isAuthorized
          ? 'rgba(16, 185, 129, 0.75)'
          : 'rgba(239, 68, 68, 0.85)';
        const bgColor = isAuthorized
          ? 'rgba(6, 78, 59, 0.85)'
          : 'rgba(127, 29, 29, 0.9)';

        ctx.save();

        // Outer glow
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = isSelected ? 24 : 14;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 3.5 : 2.5;

        // Rounded Box Frame
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();

        // High-tech corner accents
        const cornerLen = Math.min(18, w * 0.25, h * 0.25);
        ctx.lineWidth = 4;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLen, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLen);
        ctx.stroke();

        // Label Badge Container
        const labelText = isAuthorized && matchPerson ? matchPerson.name : 'Unknown Person';
        const roleText =
          isAuthorized && matchPerson
            ? `${matchPerson.role.toUpperCase()} · ${confidence}% MATCH (d: ${face.distance.toFixed(2)})`
            : `UNKNOWN – NOT REGISTERED (d: ${face.distance.toFixed(2)})`;

        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        const textWidth = Math.max(ctx.measureText(labelText).width, ctx.measureText(roleText).width);
        const badgeW = Math.max(160, textWidth + 24);
        const badgeH = 44;
        let badgeY = y - badgeH - 6;
        if (badgeY < 8) {
          // If at the top of the canvas, render inside or just below
          badgeY = y + 8;
        }
        const badgeX = Math.max(4, Math.min(width - badgeW - 4, x));

        // Badge Background
        ctx.shadowBlur = 8;
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
        ctx.fill();
        ctx.stroke();

        // Primary Name / Status Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(labelText, badgeX + 10, badgeY + 18);

        // Secondary Role + Confidence Badge
        ctx.fillStyle = isAuthorized ? '#A7F3D0' : '#FECACA';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(roleText, badgeX + 10, badgeY + 34);

        ctx.restore();
      });
    },
    [selectedFaceId, strictnessThreshold]
  );

  /**
   * Process a static image
   */
  const processImage = useCallback(
    async (src: string) => {
      setIsProcessing(true);
      try {
        const img = await createHtmlImage(src);
        const results = await detectFaces(img, registeredPersons, useHighPrecision, strictnessThreshold);
        setDetectedFaces(results);
        onFaceDetected(results, currentZone);

        // Update canvas sizing & draw overlays
        if (canvasRef.current && imageRef.current) {
          const displayWidth = imageRef.current.clientWidth;
          const displayHeight = imageRef.current.clientHeight;
          const naturalWidth = img.naturalWidth || displayWidth;
          const naturalHeight = img.naturalHeight || displayHeight;

          canvasRef.current.width = displayWidth;
          canvasRef.current.height = displayHeight;

          const scaleX = displayWidth / naturalWidth;
          const scaleY = displayHeight / naturalHeight;

          // Scale bounding boxes for display
          const scaledFaces = results.map((f) => ({
            ...f,
            box: {
              x: f.box.x * scaleX,
              y: f.box.y * scaleY,
              width: f.box.width * scaleX,
              height: f.box.height * scaleY,
            },
          }));

          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            drawDetections(ctx, scaledFaces, displayWidth, displayHeight);
          }
        }
      } catch (err) {
        console.error('Face scanning error:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [registeredPersons, useHighPrecision, strictnessThreshold, currentZone, onFaceDetected, drawDetections]
  );

  // Run detection on current image or when registeredPersons changes
  useEffect(() => {
    if (mode === 'upload' && currentImageSrc) {
      processImage(currentImageSrc);
    }
  }, [currentImageSrc, registeredPersons, mode, processImage]);

  /**
   * Webcam real-time face detection loop
   */
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (mode === 'webcam' && webcamActive) {
      const startVideo = async () => {
        try {
          setWebcamError(null);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              runWebcamDetectionLoop();
            };
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Webcam permission denied or camera not available.';
          setWebcamError(msg);
          setWebcamActive(false);
        }
      };

      const runWebcamDetectionLoop = async () => {
        if (!videoRef.current || !canvasRef.current || isDetectingLoopRef.current) return;
        isDetectingLoopRef.current = true;

        const loop = async () => {
          if (!videoRef.current || !canvasRef.current || !webcamActive) {
            isDetectingLoopRef.current = false;
            return;
          }

          if (videoRef.current.readyState === 4) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const displayW = video.clientWidth;
            const displayH = video.clientHeight;

            if (canvas.width !== displayW || canvas.height !== displayH) {
              canvas.width = displayW;
              canvas.height = displayH;
            }

            try {
              const results = await detectFaces(video, registeredPersons, false, strictnessThreshold);
              setDetectedFaces(results);
              onFaceDetected(results, currentZone);

              const scaleX = displayW / (video.videoWidth || displayW);
              const scaleY = displayH / (video.videoHeight || displayH);

              const scaledFaces = results.map((f) => ({
                ...f,
                box: {
                  x: f.box.x * scaleX,
                  y: f.box.y * scaleY,
                  width: f.box.width * scaleX,
                  height: f.box.height * scaleY,
                },
              }));

              const ctx = canvas.getContext('2d');
              if (ctx) {
                drawDetections(ctx, scaledFaces, displayW, displayH);
              }
            } catch (loopErr) {
              console.warn('Loop detect warning:', loopErr);
            }
          }

          // Throttle loop slightly for smooth performance (~180ms)
          setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(loop);
          }, 180);
        };

        loop();
      };

      startVideo();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isDetectingLoopRef.current = false;
    };
  }, [mode, webcamActive, registeredPersons, strictnessThreshold, currentZone, onFaceDetected, drawDetections]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentImageSrc(event.target.result as string);
          setSelectedSample('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Viewport & Controls Header */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setMode('upload');
                  setWebcamActive(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Hospital Surveillance Photos</span>
              </button>

              <button
                onClick={() => {
                  setMode('webcam');
                  setWebcamActive(true);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  mode === 'webcam'
                    ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Entrance Camera</span>
              </button>
            </div>

            {mode === 'upload' && (
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Quick preset selector for instant testing */}
          {mode === 'upload' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Quick Test Feeds:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setSelectedSample(sample.id);
                      setCurrentImageSrc(sample.path);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                      selectedSample === sample.id
                        ? isDark
                          ? 'bg-teal-500/25 text-teal-300 border-teal-500 shadow-sm'
                          : 'bg-teal-100 text-teal-800 border-teal-400 shadow-sm'
                        : isDark
                        ? 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode-specific actions & Strictness Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Security Threshold Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Cutoff:</span>
              </span>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {[
                  { label: 'Strict (0.42)', value: 0.42, desc: 'Ultra-strict for ICU & Surgical perimeters' },
                  { label: 'Standard (0.46)', value: 0.46, desc: 'Calibrated for Webcam & Hospital Entrance' },
                  { label: 'Tolerant (0.50)', value: 0.50, desc: 'For low-light or angled cameras' },
                ].map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => setStrictnessThreshold(lvl.value)}
                    title={lvl.desc}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      strictnessThreshold === lvl.value
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Webcam Toggle */}
            {mode === 'webcam' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWebcamActive(!webcamActive)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    webcamActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                  }`}
                >
                  {webcamActive ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Scanner Canvas & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Visual Video / Image Feed */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            className={`relative rounded-2xl overflow-hidden border shadow-xl flex items-center justify-center min-h-[380px] sm:min-h-[460px] ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-200'
            }`}
          >
            {/* Feed Status Tag */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AI DETECTION</span>
              <span className="text-slate-400">·</span>
              <span className="text-teal-300 font-semibold">{zoneInfo.name}</span>
            </div>

            {/* Neural Net Processing Spinner */}
            {isProcessing && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium text-teal-300">
                  Scanning faces with 128-D neural network...
                </p>
              </div>
            )}

            {/* Mode: Image Upload Feed */}
            {mode === 'upload' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={currentImageSrc}
                  alt="Hospital Surveillance Feed"
                  className="max-h-[580px] w-full object-contain select-none"
                  onLoad={() => {
                    if (currentImageSrc) {
                      processImage(currentImageSrc);
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair z-10"
                />
              </div>
            )}

            {/* Mode: Live Webcam Feed */}
            {mode === 'webcam' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {webcamError ? (
                  <div className="p-8 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-white mb-1">
                      Camera Stream Unavailable
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{webcamError}</p>
                    <button
                      onClick={() => setMode('upload')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white cursor-pointer"
                    >
                      Switch to Hospital Surveillance Photos
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full max-h-[580px] object-cover ${
                        !webcamActive ? 'hidden' : 'block'
                      }`}
                    />
                    {!webcamActive && (
                      <div className="text-center p-8">
                        <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-300 mb-2">
                          Live Webcam Surveillance is Inactive
                        </p>
                        <p className="text-xs text-slate-500 mb-4 max-w-sm">
                          Click below to start your device camera for real-time biometric face verification.
                        </p>
                        <button
                          onClick={() => setWebcamActive(true)}
                          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-lg cursor-pointer"
                        >
                          Activate Camera
                        </button>
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Verification Legend & Privacy note */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-400" />
                <span className="text-slate-300 font-medium">Glowing Green: Authorized (Staff/Visitor)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-400" />
                <span className="text-slate-300 font-medium">Pulsing Red: Unknown – Verify</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => processImage(currentImageSrc)}
                className="flex items-center gap-1 text-[11px] hover:text-teal-400 cursor-pointer text-slate-400"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Re-scan Frame</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Result Cards for Each Detected Face */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div
            className={`p-4 rounded-2xl border transition-all h-full flex flex-col ${
              isDark ? 'glass-panel-dark' : 'glass-panel-light'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detected Faces ({detectedFaces.length})
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Biometric Analysis
                </p>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  detectedFaces.some((f) => !f.isAuthorized)
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : detectedFaces.length > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {detectedFaces.length === 0
                  ? 'NO FACES'
                  : detectedFaces.some((f) => !f.isAuthorized)
                  ? 'UNKNOWN PRESENT'
                  : 'ALL AUTHORIZED'}
              </span>
            </div>

            {/* Results Cards List */}
            <div className="mt-3 space-y-3 overflow-y-auto max-h-[500px] pr-1 no-scrollbar flex-1">
              {detectedFaces.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    No faces detected in view
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Select a hospital surveillance feed above or upload a high-resolution hallway photo.
                  </p>
                </div>
              ) : (
                detectedFaces.map((face, index) => {
                  const isAuth = face.isAuthorized;
                  const person = face.matchPerson;

                  return (
                    <div
                      key={face.id}
                      onClick={() => setSelectedFaceId(face.id === selectedFaceId ? null : face.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                        isAuth
                          ? isDark
                            ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                            : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                          : isDark
                          ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                          : 'bg-rose-50/80 border-rose-200 hover:border-rose-300'
                      } ${selectedFaceId === face.id ? 'ring-2 ring-teal-400' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Cropped Face Thumbnail */}
                        {face.thumbnailDataUrl ? (
                          <img
                            src={face.thumbnailDataUrl}
                            alt="Face snapshot"
                            className={`w-14 h-14 rounded-lg object-cover shrink-0 border-2 ${
                              isAuth ? 'border-emerald-400' : 'border-rose-400'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
                              isAuth ? 'bg-emerald-900/40 text-emerald-300' : 'bg-rose-900/40 text-rose-300'
                            }`}
                          >
                            {isAuth ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                          </div>
                        )}

                        {/* Person Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {isAuth && person ? person.name : 'Unknown Person'}
                            </h4>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isAuth
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400 font-mono'
                              }`}
                            >
                              {isAuth ? 'AUTHORIZED' : 'UNKNOWN'}
                            </span>
                          </div>

                          {isAuth && person ? (
                            <>
                              <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 truncate">
                                {person.role} · {person.department}
                              </p>
                              {person.cardId && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  ID: {person.cardId}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[11px] text-rose-400 font-medium">
                              Unregistered biometric profile
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                            <span>
                              Dist: <strong className={isAuth ? 'text-emerald-400' : 'text-rose-400'}>{face.distance.toFixed(3)}</strong>
                            </span>
                            <span>·</span>
                            <span>Cutoff: {face.threshold ?? strictnessThreshold}</span>
                          </div>

                          <div className="mt-1">
                            {isAuth ? (
                              <span className="inline-block text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                MATCH CONFIRMED ({face.confidence}%)
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                REJECTED (Dist {face.distance.toFixed(3)} &gt; {face.threshold ?? strictnessThreshold})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Register Button for Unknown Faces */}
                      {!isAuth && (
                        <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegisterFace(face.thumbnailDataUrl);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Register this person</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
