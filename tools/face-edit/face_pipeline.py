"""CPU-only 人臉偵測、分割、貼回與相似度評分。"""

from __future__ import annotations

import hashlib
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from insightface.app import FaceAnalysis
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener(thumbnails=False)

PARSER_URL = "https://github.com/yakhyo/face-parsing/releases/download/weights/resnet18.onnx"
PARSER_SHA256 = "0d9bd318e46987c3bdbfacae9e2c0f461cae1c6ac6ea6d43bbe541a91727e33f"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


@dataclass
class FaceResult:
    bbox: np.ndarray
    embedding: np.ndarray
    count: int


def read_image(path: Path) -> Image.Image:
    """讀入並套用 EXIF 方向，統一回傳 RGB。"""
    with Image.open(path) as opened:
        return ImageOps.exif_transpose(opened).convert("RGB")


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def ensure_parser_model(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and _sha256(path) == PARSER_SHA256:
        return path
    if path.exists():
        path.unlink()
    print("首次執行：下載 BiSeNet ResNet18 ONNX 模型（約 51 MB）…")
    temp = path.with_suffix(".download")
    urllib.request.urlretrieve(PARSER_URL, temp)
    if _sha256(temp) != PARSER_SHA256:
        temp.unlink(missing_ok=True)
        raise RuntimeError("BiSeNet 模型雜湊不符，已取消使用")
    temp.replace(path)
    return path


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class FaceEngine:
    def __init__(self) -> None:
        self.app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

    def analyze(self, image: Image.Image) -> FaceResult | None:
        bgr = cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR)
        faces = self.app.get(bgr)
        if not faces:
            return None
        face = max(faces, key=lambda item: float((item.bbox[2] - item.bbox[0]) * (item.bbox[3] - item.bbox[1])))
        embedding = np.asarray(face.normed_embedding, dtype=np.float32)
        return FaceResult(np.asarray(face.bbox), embedding, len(faces))


class FaceParser:
    """CelebAMask-HQ 19 類 BiSeNet；17 是頭髮，1–13 是臉部區域。"""

    def __init__(self, model_path: Path) -> None:
        self.session = ort.InferenceSession(str(ensure_parser_model(model_path)), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [output.name for output in self.session.get_outputs()]

    def masks(self, image: Image.Image, bbox: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        rgb = np.asarray(image)
        height, width = rgb.shape[:2]
        x1, y1, x2, y2 = bbox.astype(int)
        fw, fh = x2 - x1, y2 - y1
        left = max(0, x1 - int(fw * 0.65))
        right = min(width, x2 + int(fw * 0.65))
        top = max(0, y1 - int(fh * 1.05))
        bottom = min(height, y2 + int(fh * 0.45))
        crop = rgb[top:bottom, left:right]
        resized = cv2.resize(crop, (512, 512), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0
        resized = (resized - np.array([0.485, 0.456, 0.406], np.float32)) / np.array(
            [0.229, 0.224, 0.225], np.float32
        )
        tensor = np.transpose(resized, (2, 0, 1))[None].astype(np.float32)
        output = self.session.run(self.output_names, {self.input_name: tensor})[0]
        labels = output.squeeze(0).argmax(0).astype(np.uint8)
        labels = cv2.resize(labels, (right - left, bottom - top), interpolation=cv2.INTER_NEAREST)
        full = np.zeros((height, width), dtype=np.uint8)
        full[top:bottom, left:right] = labels

        hair = (full == 17).astype(np.uint8) * 255
        hair = cv2.dilate(hair, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
        hair = cv2.GaussianBlur(hair, (0, 0), sigmaX=7, sigmaY=7)

        face = np.isin(full, np.arange(1, 14)).astype(np.uint8) * 255
        face[full == 17] = 0
        face = cv2.erode(face, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
        face = cv2.GaussianBlur(face, (0, 0), sigmaX=5, sigmaY=5)
        return hair, face


def paste_original_face(original: Image.Image, candidate: Image.Image, face_mask: np.ndarray) -> Image.Image:
    """LAB 均值對齊後，以羽化遮罩把原臉貼回候選。"""
    if candidate.size != original.size:
        candidate = candidate.resize(original.size, Image.Resampling.LANCZOS)
    source = np.asarray(original, dtype=np.uint8)
    target = np.asarray(candidate, dtype=np.uint8)
    pixels = face_mask > 32
    corrected = source.copy()
    if pixels.any():
        source_lab = cv2.cvtColor(source, cv2.COLOR_RGB2LAB).astype(np.float32)
        target_lab = cv2.cvtColor(target, cv2.COLOR_RGB2LAB).astype(np.float32)
        delta = target_lab[pixels].mean(axis=0) - source_lab[pixels].mean(axis=0)
        corrected_lab = np.clip(source_lab + delta, 0, 255).astype(np.uint8)
        corrected = cv2.cvtColor(corrected_lab, cv2.COLOR_LAB2RGB)
    alpha = (face_mask.astype(np.float32) / 255.0)[..., None]
    blended = np.clip(corrected * alpha + target * (1.0 - alpha), 0, 255).astype(np.uint8)
    return Image.fromarray(blended)


def cosine_similarity(first: np.ndarray, second: np.ndarray) -> float:
    denominator = float(np.linalg.norm(first) * np.linalg.norm(second))
    return float(np.dot(first, second) / denominator) if denominator else 0.0
