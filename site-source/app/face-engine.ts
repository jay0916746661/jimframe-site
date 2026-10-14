// Face search engine.
//
// face-api.js is still used to FIND faces and their 68 landmarks, but its own
// recognition net (ResNet-34, 2018) cannot tell many people apart, especially
// Asian faces: in testing, same-person and different-person distances
// overlapped almost completely, which is why searches returned strangers.
//
// Recognition now uses OpenCV Zoo's SFace (Apache-2.0, int8, 128-d) run by
// onnxruntime-web. Faces are aligned to the standard 112x112 ArcFace template
// from five landmarks before embedding, and junk detections (tiny or low score,
// e.g. an eye or a pair of glasses) are dropped.

type Point = { x: number; y: number };
type Detection = {
  detection: { score: number; box: { x: number; y: number; width: number; height: number } };
  landmarks: { positions: Point[] };
};
type FaceApiLike = {
  nets: { tinyFaceDetector: { loadFromUri: (url: string) => Promise<void> }; faceLandmark68Net: { loadFromUri: (url: string) => Promise<void> } };
  TinyFaceDetectorOptions: new (options: { inputSize: number; scoreThreshold: number }) => unknown;
  detectAllFaces: (image: HTMLImageElement, options: unknown) => { withFaceLandmarks: () => Promise<Detection[]> };
};
type OrtTensor = { data: Float32Array };
type OrtSession = { inputNames: string[]; outputNames: string[]; run: (feeds: Record<string, unknown>) => Promise<Record<string, OrtTensor>> };
type OrtLike = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
  InferenceSession: { create: (url: string, options?: Record<string, unknown>) => Promise<OrtSession> };
};

export type FaceEmbedding = { embedding: number[]; width: number; height: number; score: number };
export type FaceEngine = {
  options: (inputSize: number, scoreThreshold: number) => unknown;
  embedFaces: (image: HTMLImageElement, detectorOptions: unknown, quality: { minScore: number; minSize: number }) => Promise<FaceEmbedding[]>;
};

// SFace cosine thresholds. Multiple reference photos are fused defensively:
// one dark / side-profile selfie must not drag a correct match below threshold.
export const MATCH_STRONG = 0.48;
export const MATCH_LIKELY = 0.35;
export const MATCH_CANDIDATE = 0.27;

// ArcFace / SFace 112x112 template: left eye, right eye, nose tip, left and right mouth corner.
const TEMPLATE: [number, number][] = [
  [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041],
];

const mean = (points: Point[]) => points.reduce((sum, p) => ({ x: sum.x + p.x / points.length, y: sum.y + p.y / points.length }), { x: 0, y: 0 });

/** Five alignment points from face-api's 68-point landmarks. */
export const fivePoints = (p: Point[]): Point[] => [mean(p.slice(36, 42)), mean(p.slice(42, 48)), p[30], p[48], p[54]];

/** Least-squares similarity transform (rotation + uniform scale + shift) mapping src onto TEMPLATE. */
export const similarityTransform = (src: Point[]) => {
  const n = src.length;
  const sm = mean(src);
  const dm = TEMPLATE.reduce((s, [x, y]) => ({ x: s.x + x / n, y: s.y + y / n }), { x: 0, y: 0 });
  let norm = 0, a = 0, b = 0;
  src.forEach((p, i) => {
    const ax = p.x - sm.x, ay = p.y - sm.y, bx = TEMPLATE[i][0] - dm.x, by = TEMPLATE[i][1] - dm.y;
    norm += ax * ax + ay * ay; a += ax * bx + ay * by; b += ax * by - ay * bx;
  });
  a /= norm; b /= norm;
  return { a, b, tx: dm.x - (a * sm.x - b * sm.y), ty: dm.y - (b * sm.x + a * sm.y) };
};

const cosine = (left: number[], right: number[]) => {
  if (left.length !== right.length || !left.length) return -1;
  let dot = 0;
  for (let i = 0; i < left.length; i++) dot += left[i] * right[i];
  return dot;
};

/**
 * Combine 1-3 reference photos without letting one poor reference poison the
 * result. The strongest reference carries 75%; the remaining valid references
 * provide supporting evidence. This also makes a solo selfie + an event photo
 * useful together.
 */
export const referenceScore = (queries: number[][], face: number[]) => {
  if (!queries.length) return -1;
  const scores = queries.map(query => cosine(query, face)).filter(Number.isFinite).sort((a, b) => b - a);
  if (!scores.length) return -1;
  if (scores.length === 1) return scores[0];
  const support = scores.slice(1).reduce((sum, value) => sum + value, 0) / (scores.length - 1);
  return scores[0] * 0.75 + support * 0.25;
};

/** Best face in the event photo wins. Returns -1 when nothing can be compared. */
export const photoScore = (queries: number[][], faces: number[][]) => {
  if (!queries.length || !faces.length) return -1;
  let best = -1;
  for (const face of faces) best = Math.max(best, referenceScore(queries, face));
  return best;
};

const loadScript = (src: string, globalName: string) => new Promise<void>((resolve, reject) => {
  if ((window as unknown as Record<string, unknown>)[globalName]) { resolve(); return; }
  const script = document.createElement("script");
  script.src = src; script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error(`FACE_SCRIPT_LOAD_FAILED ${src}`));
  document.head.appendChild(script);
});

let engineLoader: Promise<FaceEngine> | null = null;

export const loadFaceEngine = () => {
  if (engineLoader) return engineLoader;
  engineLoader = (async () => {
    await Promise.all([loadScript("/face-api/face-api.min.js", "faceapi"), loadScript("/ort/ort.wasm.min.js", "ort")]);
    const api = (window as unknown as { faceapi: FaceApiLike }).faceapi;
    const ort = (window as unknown as { ort: OrtLike }).ort;
    ort.env.wasm.wasmPaths = "/ort/";
    ort.env.wasm.numThreads = 1; // threads need cross-origin isolation, which this site does not set
    const weights = "/face-api/weights";
    const [session] = await Promise.all([
      ort.InferenceSession.create("/face-api/sface_int8.onnx", { executionProviders: ["wasm"], graphOptimizationLevel: "all" }),
      api.nets.tinyFaceDetector.loadFromUri(weights),
      api.nets.faceLandmark68Net.loadFromUri(weights),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = 112; canvas.height = 112;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("FACE_CANVAS_UNAVAILABLE");
    const input = new Float32Array(3 * 112 * 112);
    const embed = async (image: HTMLImageElement, landmarks: Point[]) => {
      const { a, b, tx, ty } = similarityTransform(fivePoints(landmarks));
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#000"; context.fillRect(0, 0, 112, 112);
      context.setTransform(a, b, -b, a, tx, ty);
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, 112, 112).data;
      // SFace takes raw 0-255 RGB, channel-first.
      for (let i = 0, p = 0; i < 112 * 112; i++, p += 4) {
        input[i] = pixels[p]; input[12544 + i] = pixels[p + 1]; input[25088 + i] = pixels[p + 2];
      }
      const output = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, 112, 112]) });
      const vector = output[session.outputNames[0]].data;
      let length = 0; for (const v of vector) length += v * v;
      length = Math.sqrt(length) || 1;
      return Array.from(vector, v => Math.round((v / length) * 10000) / 10000);
    };
    return {
      options: (inputSize: number, scoreThreshold: number) => new api.TinyFaceDetectorOptions({ inputSize, scoreThreshold }),
      embedFaces: async (image, detectorOptions, quality) => {
        const detections = await api.detectAllFaces(image, detectorOptions).withFaceLandmarks();
        const faces: FaceEmbedding[] = [];
        for (const face of detections) {
          const { width, height } = face.detection.box;
          if (face.detection.score < quality.minScore || Math.min(width, height) < quality.minSize) continue;
          faces.push({ embedding: await embed(image, face.landmarks.positions), width, height, score: face.detection.score });
        }
        return faces;
      },
    } satisfies FaceEngine;
  })();
  engineLoader.catch(() => { engineLoader = null; });
  return engineLoader;
};
