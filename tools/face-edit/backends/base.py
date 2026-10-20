"""影像編輯後端共同介面。"""

from __future__ import annotations

from abc import ABC, abstractmethod
from PIL import Image


class ImageEditBackend(ABC):
    @abstractmethod
    def edit(self, image: Image.Image, hair_mask: Image.Image, prompt: str) -> Image.Image:
        """以原圖、頭髮遮罩及提示詞產生一張候選圖。"""
        raise NotImplementedError
