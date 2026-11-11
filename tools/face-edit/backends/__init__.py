"""影像編輯後端載入器。"""

from __future__ import annotations

import importlib

from .base import ImageEditBackend


def load_backend(name: str, config: dict[str, str]) -> ImageEditBackend:
    """依名稱載入 backends/<name>.py；新增後端時不必修改 run.py。"""
    if not name.replace("_", "").isalnum():
        raise ValueError(f"不合法的後端名稱：{name}")
    module = importlib.import_module(f"backends.{name}")
    backend_class = getattr(module, "Backend", None)
    if backend_class is None:
        raise RuntimeError(f"backends/{name}.py 必須提供 Backend 類別")
    return backend_class(config)
