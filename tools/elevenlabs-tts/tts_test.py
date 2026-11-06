"""不打網路的檢查：請求組裝、金鑰不外洩、缺參數會停、workflow 只有手動觸發。"""
import io
import json
import socket
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tts

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "elevenlabs-tts.yml"
KEY = "test-api-key-do-not-use"
VOICE = "21m00Tcm4TlvDq8ikWAM"
FAKE_SHAPED_KEY = "sk" + "_" + ("a" * 12)


class FakeResponse:
    def __init__(self, status_code, content, headers=None):
        self.status_code = status_code
        self.content = content if isinstance(content, bytes) else content.encode()
        self.headers = headers or {}

    def json(self):
        return json.loads(self.content.decode())


def mp3_body():
    return b"ID3" + b"\x00" * 32


class NoNetwork(unittest.TestCase):
    def setUp(self):
        self._orig = socket.create_connection
        socket.create_connection = self._blocked

    def tearDown(self):
        socket.create_connection = self._orig

    @staticmethod
    def _blocked(*_args, **_kwargs):
        raise AssertionError("不該連網")


class ResolveTests(NoNetwork):
    def test_voice_and_model_precedence(self):
        args = tts.parse_args(["--text", "你好"])
        text, voice, model, _key = tts.resolve_settings(args, {
            "TTS_VOICE_ID": "frominputvoice",
            "ELEVENLABS_VOICE_ID": "fromsecretvoice",
            "TTS_MODEL_ID": "eleven_turbo_v2_5",
        })
        self.assertEqual(text, "你好")
        self.assertEqual(voice, "frominputvoice")
        self.assertEqual(model, "eleven_turbo_v2_5")

        args = tts.parse_args(["--text", "你好", "--voice-id", "clivoiceid", "--model-id", "eleven_v3"])
        _text, voice, model, _key = tts.resolve_settings(args, {
            "TTS_VOICE_ID": "frominputvoice",
            "ELEVENLABS_VOICE_ID": "fromsecretvoice",
            "TTS_MODEL_ID": "eleven_turbo_v2_5",
        })
        self.assertEqual(voice, "clivoiceid")
        self.assertEqual(model, "eleven_v3")

        args = tts.parse_args([])
        text, voice, model, key = tts.resolve_settings(args, {
            "TTS_TEXT": "  你好  ",
            "TTS_VOICE_ID": "",
            "TTS_MODEL_ID": "",
            "ELEVENLABS_VOICE_ID": "fromsecretvoice",
            "ELEVENLABS_API_KEY": KEY,
        })
        self.assertEqual((text, voice, model, key), ("你好", "fromsecretvoice", tts.DEFAULT_MODEL, KEY))


class SynthesizeTests(NoNetwork):
    def test_request_shape_and_file(self):
        calls = []

        def post(url, **kwargs):
            calls.append((url, kwargs))
            return FakeResponse(200, mp3_body(), {"Content-Type": "audio/mpeg"})

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "speech.mp3"
            buf = io.StringIO()
            err = io.StringIO()
            with mock.patch("sys.stdout", buf), mock.patch("sys.stderr", err):
                code = tts.main([
                    "--text", "你好，這是測試。",
                    "--voice-id", VOICE,
                    "--out", str(out),
                ], post=post, env={"ELEVENLABS_API_KEY": KEY})
            self.assertEqual(code, 0)
            self.assertEqual(out.read_bytes(), mp3_body())
            url, kwargs = calls[0]
            self.assertEqual(url, f"{tts.API_ROOT}/{VOICE}")
            self.assertEqual(kwargs["headers"]["xi-api-key"], KEY)
            self.assertEqual(kwargs["headers"]["Content-Type"], "application/json")
            self.assertEqual(kwargs["params"], {"output_format": "mp3_44100_128"})
            self.assertEqual(kwargs["json"], {"text": "你好，這是測試。", "model_id": "eleven_multilingual_v2"})
            self.assertEqual(kwargs["timeout"], 120)
            self.assertFalse(kwargs["allow_redirects"])
            leaked = buf.getvalue() + err.getvalue()
            self.assertNotIn(KEY, leaked)

    def test_workflow_env_contract(self):
        calls = []

        def post(url, **kwargs):
            calls.append((url, kwargs))
            return FakeResponse(200, mp3_body(), {"Content-Type": "audio/mpeg"})

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "speech.mp3"
            with mock.patch("sys.stdout", io.StringIO()), mock.patch("sys.stderr", io.StringIO()):
                code = tts.main(["--out", str(out)], post=post, env={
                    "ELEVENLABS_API_KEY": KEY,
                    "ELEVENLABS_VOICE_ID": "secretvoiceid",
                    "TTS_TEXT": "從 workflow 來的句子",
                    "TTS_VOICE_ID": "",
                    "TTS_MODEL_ID": "",
                })
        self.assertEqual(code, 0)
        url, kwargs = calls[0]
        self.assertEqual(url, f"{tts.API_ROOT}/secretvoiceid")
        self.assertEqual(kwargs["json"]["text"], "從 workflow 來的句子")
        self.assertEqual(kwargs["json"]["model_id"], "eleven_multilingual_v2")
        self.assertEqual(kwargs["headers"]["xi-api-key"], KEY)
        self.assertEqual(kwargs["params"]["output_format"], "mp3_44100_128")

    def test_error_body_cannot_leak_key(self):
        def post(_url, **_kwargs):
            body = json.dumps({"detail": {"status": "invalid_api_key", "message": f"bad {KEY} {FAKE_SHAPED_KEY}"}})
            return FakeResponse(401, body, {"Content-Type": "application/json"})

        err = io.StringIO()
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "speech.mp3"
            with mock.patch("sys.stderr", err), mock.patch("sys.stdout", io.StringIO()):
                code = tts.main(["--text", "hi", "--voice-id", VOICE, "--out", str(out)], post=post, env={"ELEVENLABS_API_KEY": KEY})
            self.assertEqual(code, 1)
            self.assertFalse(out.exists())
        message = err.getvalue()
        self.assertIn("401", message)
        self.assertNotIn(KEY, message)
        self.assertNotIn(FAKE_SHAPED_KEY, message)
        self.assertIn("sk_***", message)

    def test_json_success_is_not_saved(self):
        def post(_url, **_kwargs):
            return FakeResponse(200, b'{"detail":"nope"}', {"Content-Type": "application/json"})

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "speech.mp3"
            with mock.patch("sys.stderr", io.StringIO()), mock.patch("sys.stdout", io.StringIO()):
                code = tts.main(["--text", "hi", "--voice-id", VOICE, "--out", str(out)], post=post, env={"ELEVENLABS_API_KEY": KEY})
            self.assertEqual(code, 1)
            self.assertFalse(out.exists())

    def test_timeout_does_not_print_key(self):
        def post(_url, **_kwargs):
            raise tts.requests.Timeout(f"timed out {KEY}")

        err = io.StringIO()
        with mock.patch("sys.stderr", err), mock.patch("sys.stdout", io.StringIO()):
            code = tts.main(["--text", "hi", "--voice-id", VOICE], post=post, env={"ELEVENLABS_API_KEY": KEY})
        self.assertEqual(code, 1)
        self.assertNotIn(KEY, err.getvalue())
        self.assertIn("Timeout", err.getvalue())


class GuardTests(NoNetwork):
    def test_missing_inputs_do_not_call_api(self):
        def post(*_args, **_kwargs):
            raise AssertionError("不該呼叫 API")

        err = io.StringIO()
        with mock.patch("sys.stderr", err):
            self.assertEqual(tts.main(["--voice-id", VOICE], post=post, env={"ELEVENLABS_API_KEY": KEY}), 1)
            self.assertEqual(tts.main(["--text", "hi"], post=post, env={"ELEVENLABS_API_KEY": KEY}), 1)
            self.assertEqual(tts.main(["--text", "hi", "--voice-id", VOICE], post=post, env={}), 1)
        self.assertIn("ELEVENLABS_API_KEY", err.getvalue())
        self.assertNotIn(KEY, err.getvalue())

    def test_dry_run_skips_api_and_key(self):
        def post(*_args, **_kwargs):
            raise AssertionError("不該呼叫 API")

        out = io.StringIO()
        with mock.patch("sys.stdout", out):
            code = tts.main(["--text", "你好", "--voice-id", VOICE, "--dry-run"], post=post, env={})
        self.assertEqual(code, 0)
        self.assertIn("dry-run", out.getvalue())
        self.assertIn("eleven_multilingual_v2", out.getvalue())
        self.assertNotIn(KEY, out.getvalue())

    def test_key_shaped_voice_is_rejected_quietly(self):
        def post(*_args, **_kwargs):
            raise AssertionError("不該呼叫 API")

        err = io.StringIO()
        with mock.patch("sys.stderr", err), mock.patch("sys.stdout", io.StringIO()):
            code = tts.main(["--text", "hi", "--voice-id", FAKE_SHAPED_KEY], post=post, env={"ELEVENLABS_API_KEY": "other-key"})
        self.assertEqual(code, 1)
        self.assertNotIn(FAKE_SHAPED_KEY, err.getvalue())

    def test_slash_voice_rejected(self):
        def post(*_args, **_kwargs):
            raise AssertionError("不該呼叫 API")

        with mock.patch("sys.stderr", io.StringIO()):
            code = tts.main(["--text", "hi", "--voice-id", "../etc", "--model-id", "eleven_multilingual_v2"], post=post, env={"ELEVENLABS_API_KEY": KEY})
        self.assertEqual(code, 1)


class WorkflowTests(NoNetwork):
    def test_workflow_is_manual_only(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", text)
        self.assertIn("ElevenLabs TTS（手動）", text)
        for banned in ("schedule:", "pull_request:", "push:", "repository_dispatch:", "workflow_call:"):
            self.assertNotIn(banned, text)
        for banned in ("META_USER_TOKEN", "THREADS_TOKENS", "ig_publish", "fb_publish", "poster.py", "meta.py"):
            self.assertNotIn(banned, text)
        self.assertNotIn(KEY, text)
        data = yaml.safe_load(text)
        trigger = data[True]  # PyYAML 1.1 會把 on 讀成 True
        self.assertEqual(list(trigger), ["workflow_dispatch"])
        inputs = trigger["workflow_dispatch"]["inputs"]
        self.assertTrue(inputs["text"]["required"])
        self.assertFalse(inputs["voice_id"]["required"])
        self.assertFalse(inputs["model_id"]["required"])
        self.assertEqual(data["permissions"]["contents"], "read")
        self.assertEqual(data["permissions"]["actions"], "write")
        job = data["jobs"]["tts"]
        blob = yaml.dump(job, allow_unicode=True)
        self.assertIn("3.12", blob)
        self.assertIn("pip install requests", blob)
        self.assertIn("tools/elevenlabs-tts/tts.py", blob)
        self.assertIn("actions/upload-artifact@v4", blob)
        self.assertIn("ELEVENLABS_API_KEY", blob)
        self.assertIn("ELEVENLABS_VOICE_ID", blob)
        self.assertNotIn("git commit", blob)
        self.assertNotIn("git push", blob)


if __name__ == "__main__":
    unittest.main()
