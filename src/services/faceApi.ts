import * as faceapi from '@vladmandic/face-api';
import { DetectedFaceResult, RegisteredPerson } from '../types';

const MODEL_CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export interface ModelLoadProgress {
  loaded: boolean;
  loading: boolean;
  progressText: string;
  error: string | null;
}

let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

export async function loadFaceApiModels(
  onProgress?: (text: string) => void
): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      onProgress?.('Loading Tiny Face Detector weights...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_CDN_URL);

      onProgress?.('Loading Facial Landmark model (Tiny Net)...');
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_CDN_URL);

      onProgress?.('Loading 128-D Face Recognition Network...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_CDN_URL);

      // Load SSD MobileNet in background for ultra-high-definition photo scans
      onProgress?.('Loading high-precision MobileNet detector...');
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_CDN_URL);
      } catch (e) {
        console.warn('SSD MobileNet fallback warning:', e);
      }

      modelsLoaded = true;
      onProgress?.('Models initialized successfully.');
    } catch (err: unknown) {
      modelsLoaded = false;
      const errorMsg = err instanceof Error ? err.message : 'Failed to load face detection neural network weights';
      console.error('Error loading face-api models:', err);
      throw new Error(errorMsg);
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Build a FaceMatcher from registered persons with calibrated distance threshold.
 * In face-api.js with TinyLandmarks:
 * - Distance <= 0.46: Authentic verified match of the same person
 * - Distance > 0.46: Unregistered / unknown person
 */
export function buildFaceMatcher(
  registeredPersons: RegisteredPerson[],
  maxDescriptorDistance = 0.46
): faceapi.FaceMatcher | null {
  const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

  for (const person of registeredPersons) {
    if (person.descriptors && person.descriptors.length > 0) {
      const float32Descriptors = person.descriptors.map(
        (arr) => new Float32Array(arr)
      );
      labeledDescriptors.push(
        new faceapi.LabeledFaceDescriptors(person.id, float32Descriptors)
      );
    }
  }

  if (labeledDescriptors.length === 0) {
    return null;
  }

  return new faceapi.FaceMatcher(labeledDescriptors, maxDescriptorDistance);
}

/**
 * Extract face descriptor(s) from an image element or data URL
 * Uses identical TinyLandmarks model as video loop to guarantee vector alignment!
 */
export async function extractFaceDescriptorFromImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | string
): Promise<{ descriptor: number[]; thumbnail: string; box: { x: number; y: number; width: number; height: number } } | null> {
  await loadFaceApiModels();

  let imgEl: HTMLImageElement;
  if (typeof imageSource === 'string') {
    imgEl = await createHtmlImage(imageSource);
  } else if (imageSource instanceof HTMLCanvasElement) {
    const dataUrl = imageSource.toDataURL('image/jpeg');
    imgEl = await createHtmlImage(dataUrl);
  } else {
    imgEl = imageSource;
  }

  let detection = null;

  // Try SSD first for photos
  if (faceapi.nets.ssdMobilenetv1.isLoaded) {
    try {
      detection = await faceapi
        .detectSingleFace(imgEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
    } catch (e) {
      console.warn('Single face SSD detect error:', e);
    }
  }

  // Fallback to TinyFaceDetector
  if (!detection) {
    detection = await faceapi
      .detectSingleFace(imgEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.20 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor();
  }

  if (!detection) return null;

  const box = {
    x: Math.max(0, detection.detection.box.x),
    y: Math.max(0, detection.detection.box.y),
    width: detection.detection.box.width,
    height: detection.detection.box.height,
  };

  const thumbnail = cropFaceThumbnail(imgEl, box);

  return {
    descriptor: Array.from(detection.descriptor),
    thumbnail,
    box,
  };
}

/**
 * Crop face thumbnail from image/video element
 */
export function cropFaceThumbnail(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  paddingFactor = 0.35
): string {
  try {
    const canvas = document.createElement('canvas');
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const padW = box.width * paddingFactor;
    const padH = box.height * paddingFactor;
    const sx = Math.max(0, box.x - padW);
    const sy = Math.max(0, box.y - padH);
    const sw = Math.min(
      (source as HTMLImageElement).naturalWidth || (source as HTMLVideoElement).videoWidth || source.width,
      box.width + padW * 2
    );
    const sh = Math.min(
      (source as HTMLImageElement).naturalHeight || (source as HTMLVideoElement).videoHeight || source.height,
      box.height + padH * 2
    );

    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.error('Failed to crop face thumbnail:', err);
    return '';
  }
}

/**
 * Run full detection on an image or video frame against registered persons.
 * Enforces:
 * 1. Consistent landmark extractor (withFaceLandmarks(true)) matching registration
 * 2. Strict Euclidean distance boundary matching the selected cutoff
 * 3. Spatial deduplication (non-maximum suppression) so only REAL faces are listed
 */
export async function detectFaces(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  registeredPersons: RegisteredPerson[],
  useHighPrecision = false,
  maxDistance = 0.46
): Promise<DetectedFaceResult[]> {
  await loadFaceApiModels();

  const matcher = buildFaceMatcher(registeredPersons, maxDistance);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let detections: Array<any> = [];

  // Try SSD MobileNet for high precision photo scans
  if (useHighPrecision && faceapi.nets.ssdMobilenetv1.isLoaded) {
    try {
      detections = await faceapi
        .detectAllFaces(source, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.30 }))
        .withFaceLandmarks(true)
        .withFaceDescriptors();
    } catch (e) {
      console.warn('SSD MobileNet detection error, falling back:', e);
    }
  }

  // If no detections found or for live webcam, run TinyFaceDetector
  if (!detections || detections.length === 0) {
    const isVideo = source instanceof HTMLVideoElement;
    // For video, 0.35 prevents ghost face detections in background clutter
    const scoreThresh = isVideo ? 0.35 : 0.22;
    detections = await faceapi
      .detectAllFaces(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: scoreThresh }))
      .withFaceLandmarks(true)
      .withFaceDescriptors();
  }

  // Deduplicate overlapping bounding boxes (prevents 1 face appearing multiple times)
  const filteredDetections = deduplicateFaces(detections);
  const results: DetectedFaceResult[] = [];

  for (let i = 0; i < filteredDetections.length; i++) {
    const d = filteredDetections[i];
    const box = {
      x: d.detection.box.x,
      y: d.detection.box.y,
      width: d.detection.box.width,
      height: d.detection.box.height,
    };

    let isAuthorized = false;
    let matchPerson: RegisteredPerson | undefined;
    let confidence = Math.round(d.detection.score * 100);
    let distance = 1.0;

    if (matcher && d.descriptor) {
      const bestMatch = matcher.findBestMatch(d.descriptor);
      distance = Number(bestMatch.distance.toFixed(3));

      // VALIDATION CRITERIA:
      // 1. Label cannot be 'unknown'
      // 2. Distance MUST be <= maxDistance (e.g. 0.46)
      if (bestMatch.label !== 'unknown' && bestMatch.distance <= maxDistance) {
        const found = registeredPersons.find((p) => p.id === bestMatch.label);
        if (found) {
          isAuthorized = true;
          matchPerson = found;
          // Normalized confidence: close distance (e.g. 0.25) -> 95%, threshold distance -> 75%
          const normalizedRatio = Math.max(0, Math.min(1, bestMatch.distance / maxDistance));
          confidence = Math.round(98 - normalizedRatio * 24);
        }
      }
    }

    const thumbnailDataUrl = cropFaceThumbnail(source, box);

    results.push({
      id: `face-${Date.now()}-${i}`,
      box,
      isAuthorized,
      matchPerson,
      confidence,
      distance,
      threshold: maxDistance,
      descriptor: Array.from(d.descriptor),
      thumbnailDataUrl,
    });
  }

  return results;
}

/**
 * Filter out duplicate overlapping detections of the same face
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deduplicateFaces(detections: Array<any>): Array<any> {
  if (detections.length <= 1) return detections;

  const valid: Array<any> = [];
  for (const curr of detections) {
    const box1 = curr.detection.box;
    const isDuplicate = valid.some((kept) => {
      const box2 = kept.detection.box;
      // Compute Intersection over Union (IoU)
      const xA = Math.max(box1.x, box2.x);
      const yA = Math.max(box1.y, box2.y);
      const xB = Math.min(box1.x + box1.width, box2.x + box2.width);
      const yB = Math.min(box1.y + box1.height, box2.y + box2.height);
      const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
      const box1Area = box1.width * box1.height;
      const box2Area = box2.width * box2.height;
      const iou = interArea / (box1Area + box2Area - interArea);
      return iou > 0.40; // overlap threshold
    });

    if (!isDuplicate) {
      valid.push(curr);
    }
  }

  return valid;
}

export function createHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from source'));
    img.src = src;
  });
}
