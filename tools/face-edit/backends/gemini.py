"""Gemini 原生影像編輯後端。"""

from __future__ import annotations

from io import BytesIO

from google import genai
from google.genai import types
from PIL import Image

from .base import ImageEditBackend


def _png_bytes(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class Backend(ImageEditBackend):
    def __init__(self, config: dict[str, str]) -> None:
        api_key = config.get("GEMINI_API_KEY", "").strip()
        self.model = config.get("GEMINI_MODEL", "").strip()
        if not api_key:
            raise RuntimeError(".env 缺少 GEMINI_API_KEY")
        if not self.model:
            raise RuntimeError(".env 缺少 GEMINI_MODEL")
        self.client = genai.Client(api_key=api_key)

    def edit(self, image: Image.Image, hair_mask: Image.Image, prompt: str) -> Image.Image:
        instruction = (
            "Edit only the hair area marked white in the second image. "
            "Keep the face, identity, pose, clothes, background, framing and image size unchanged. "
            f"Hair edit request: {prompt}"
        )
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                types.Part.from_text(text=instruction),
                types.Part.from_bytes(data=_png_bytes(image), mime_type="image/png"),
                types.Part.from_bytes(data=_png_bytes(hair_mask), mime_type="image/png"),
            ],
            config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
        )
        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                if part.inline_data and part.inline_data.data:
                    return Image.open(BytesIO(part.inline_data.data)).convert("RGB")
        raise RuntimeError("Gemini 沒有回傳影像")
