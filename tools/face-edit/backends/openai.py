"""OpenAI 影像編輯後端預留殼。"""

from __future__ import annotations

from PIL import Image

from .base import ImageEditBackend


class Backend(ImageEditBackend):
    def __init__(self, config: dict[str, str]) -> None:
        self.config = config

    def edit(self, image: Image.Image, hair_mask: Image.Image, prompt: str) -> Image.Image:
        # TODO: 串接 OpenAI 影像編輯 API。
        raise NotImplementedError("OpenAI 後端尚未實作")
