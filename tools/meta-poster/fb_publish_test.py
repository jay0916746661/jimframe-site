"""不打網路的檢查：佇列規則、粉專對應、各類貼文打哪些端點、錯誤訊息不帶 token。"""
import csv
import io
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fb_publish as fb

TPE = timezone(timedelta(hours=8))
TOKEN = "PAGE_TOKEN_SHOULD_NOT_LEAK"
USER = "USER_TOKEN_SHOULD_NOT_LEAK"


def row(**kwargs):
    base = {k: "" for k in fb.FIELDS}
    base.update(kwargs)
    return fb.normalize(base)


class FakeGraph:
    force = True

    def __init__(self, pages=None, perms=None):
        self._pages = pages or [{"id": "111", "name": "爵士101", "access_token": TOKEN}]
        self._perms = perms or [
            {"permission": p, "status": "granted"} for p in fb.NEED_PERMS
        ]
        self.posts = []
        self.videos = []
        self.uploads = []
        self.gets = []
        self.statuses = {}

    def pages(self):
        return self._pages

    def get(self, path, token=None, **params):
        self.gets.append((path, params))
        if path == "me/permissions":
            return {"data": self._perms}
        return {"status": self.statuses.get(str(path), {"video_status": "ready", "uploading_phase": {"status": "complete"}, "publishing_phase": {"status": "complete"}})}

    def post(self, path, token, **data):
        self.posts.append((path, token, data))
        if path.endswith("/video_reels") and data.get("upload_phase") == "start":
            return {"video_id": "9001", "upload_url": "https://rupload.facebook.com/video-upload/v21.0/9001"}
        if path.endswith("/video_reels"):
            return {"success": True}
        if path.endswith("/photos"):
            return {"id": f"ph{len(self.posts)}", "post_id": f"111_50{len(self.posts)}"}
        return {"id": "111_777"}

    def video(self, page_id, token, **data):
        self.videos.append((page_id, token, data))
        return {"id": "555"}

    def upload_hosted(self, upload_url, token, file_url):
        self.uploads.append((upload_url, token, file_url))
        return {"success": True}


class QueueTests(unittest.TestCase):
    def test_shipped_queue_cannot_post(self):
        rows = fb.read(fb.QUEUE)
        self.assertTrue(rows)
        self.assertEqual(list(csv.DictReader(io.StringIO(fb.QUEUE.read_text(encoding="utf-8"))).fieldnames), fb.FIELDS)
        self.assertTrue(all(r["status"] != "待發" for r in rows))
        now = datetime(2026, 11, 4, 12, 0, tzinfo=TPE)
        self.assertEqual(fb.classify([dict(r) for r in rows], now), [])

    def test_overdue_and_cap(self):
        now = datetime(2026, 11, 5, 18, 0, tzinfo=TPE)
        rows = [
            row(id="old", status="待發", publish_at="2026-11-05 10:00", type="text", caption="a", account="爵士101"),
            row(id="future", status="待發", publish_at="2026-11-06 10:00", type="text", caption="a", account="爵士101"),
            row(id="example", status="範例", publish_at="2026-11-05 17:00", type="text", caption="a", account="爵士101"),
        ]
        for i in range(5):
            rows.append(row(id=f"d{i}", status="待發", publish_at="2026-11-05 17:30", type="text", caption="a", account="爵士101"))
        due = fb.classify(rows, now)
        self.assertEqual([r["id"] for r in due], [f"d{i}" for i in range(5)])
        self.assertEqual(rows[0]["status"], "逾時")
        self.assertEqual(rows[1]["status"], "待發")
        self.assertEqual(rows[2]["status"], "範例")
        self.assertEqual([r["id"] for r in due[:fb.PER_RUN]], ["d0", "d1", "d2", "d3"])

    def test_bad_time_marks_failed(self):
        rows = [row(id="x", status="待發", publish_at="明天", type="text", caption="a", account="爵士101")]
        self.assertEqual(fb.classify(rows, datetime(2026, 11, 5, tzinfo=TPE)), [])
        self.assertEqual(rows[0]["status"], "失敗")


class MatchTests(unittest.TestCase):
    def setUp(self):
        self.pages = [
            {"id": "111", "name": "爵士101", "access_token": TOKEN},
            {"id": "222", "name": "咖啡故事", "access_token": TOKEN},
            {"id": "333", "name": "同名", "access_token": TOKEN},
            {"id": "444", "name": "同名", "access_token": TOKEN},
        ]

    def test_match_id_or_name(self):
        self.assertEqual(fb.match_page("222", self.pages)["name"], "咖啡故事")
        self.assertEqual(fb.match_page("爵士101", self.pages)["id"], "111")

    def test_ambiguous_or_missing(self):
        with self.assertRaises(RuntimeError):
            fb.match_page("同名", self.pages)
        with self.assertRaises(RuntimeError):
            fb.match_page("沒有這頁", self.pages)


class PublishTests(unittest.TestCase):
    def setUp(self):
        fb.SEEN.clear()
        self.g = FakeGraph()
        self.page = self.g.pages()[0]
        fb.remember(USER)

    def test_text_and_link(self):
        pid, _ = fb.publish(row(type="link", caption="你好", link="https://example.com"), self.page, self.g)
        self.assertEqual(pid, "111_777")
        path, token, data = self.g.posts[0]
        self.assertEqual(path, "111/feed")
        self.assertEqual(token, TOKEN)
        self.assertEqual(data["message"], "你好")
        self.assertEqual(data["link"], "https://example.com")

    def test_single_and_multi_photo(self):
        fb.publish(row(type="photo", media="social/media/a.jpg", caption="一張"), self.page, self.g)
        self.assertEqual(self.g.posts[0][0], "111/photos")
        self.assertTrue(self.g.posts[0][2]["url"].endswith("social/media/a.jpg"))
        self.assertEqual(self.g.posts[0][2]["published"], "true")
        self.g.posts.clear()
        fb.publish(row(type="photo", media="social/media/a.jpg social/media/b.jpg", caption="兩張"), self.page, self.g)
        self.assertEqual(self.g.posts[0][2]["published"], "false")
        self.assertEqual(self.g.posts[1][2]["published"], "false")
        feed = self.g.posts[2]
        self.assertEqual(feed[0], "111/feed")
        self.assertIn("media_fbid", feed[2]["attached_media[0]"])
        self.assertIn("media_fbid", feed[2]["attached_media[1]"])

    def test_video_and_reel_endpoints(self):
        vid, _ = fb.publish(row(type="video", media="social/media/a.mp4", caption="影片"), self.page, self.g, tries=1, pause=0)
        self.assertEqual(vid, "555")
        self.assertEqual(self.g.videos[0][0], "111")
        self.assertEqual(self.g.videos[0][2]["file_url"].endswith("social/media/a.mp4"), True)
        self.assertEqual(self.g.videos[0][2]["published"], "true")
        rid, _ = fb.publish(row(type="reel", media="https://example.com/r.mov", caption="短片"), self.page, self.g, tries=1, pause=0)
        self.assertEqual(rid, "9001")
        self.assertEqual(self.g.posts[-2][0], "111/video_reels")
        self.assertEqual(self.g.posts[-2][2]["upload_phase"], "start")
        self.assertEqual(self.g.uploads[0][2], "https://example.com/r.mov")
        finish = self.g.posts[-1][2]
        self.assertEqual(finish["upload_phase"], "finish")
        self.assertEqual(finish["video_state"], "PUBLISHED")
        self.assertEqual(finish["video_id"], "9001")

    def test_reel_processing_error_keeps_id_and_scrubs_token(self):
        self.g.statuses["9001"] = {"video_status": "error", "processing_phase": {"status": "error", "error": {"message": f"解析度不足 {TOKEN}"}}}
        # 上傳階段先通過，發佈後才失敗
        calls = {"n": 0}

        def get(path, token=None, **params):
            self.g.gets.append(path)
            if path == "9001" and calls["n"] == 0:
                calls["n"] += 1
                return {"status": {"video_status": "processing", "uploading_phase": {"status": "complete"}}}
            return {"status": self.g.statuses["9001"]}

        self.g.get = get
        with self.assertRaises(RuntimeError) as ctx:
            fb.publish(row(type="reel", media="social/media/a.mp4", caption="x"), self.page, self.g, tries=1, pause=0)
        msg = fb.scrub(ctx.exception)
        self.assertIn("已呼叫發佈", msg)
        self.assertIn("video_id=9001", msg)
        self.assertNotIn(TOKEN, msg)
        self.assertNotIn(USER, msg)

    def test_scrub_query_token(self):
        fb.remember(USER)
        self.assertNotIn(USER, fb.scrub(f"boom access_token={USER}&ok=1"))
        self.assertIn("access_token=***", fb.scrub("boom access_token=EAABother&ok=1"))


class RunTests(unittest.TestCase):
    def setUp(self):
        fb.SEEN.clear()
        self.now = datetime(2026, 11, 5, 18, 0, tzinfo=TPE)

    def write_queue(self, path, rows):
        fb.write(rows, path)

    def test_dry_run_does_not_write_or_post(self, tmp=None):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "fb_queue.csv"
            self.write_queue(path, [
                row(id="due", status="待發", publish_at="2026-11-05 17:00", type="text", caption="你好", account="爵士101"),
                row(id="old", status="待發", publish_at="2026-11-05 10:00", type="text", caption="太晚", account="爵士101"),
            ])
            before = path.read_bytes()
            g = FakeGraph()
            buf = io.StringIO()
            from contextlib import redirect_stdout
            with redirect_stdout(buf):
                self.assertEqual(fb.main(["--dry-run"], now=self.now, graph=g, queue_path=path, pause=0), 0)
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(g.posts, [])
            out = buf.getvalue()
            self.assertIn("[會發] due", out)
            self.assertIn("[逾時] old", out)
            self.assertIn("爵士101（111）", out)
            self.assertNotIn(TOKEN, out)

    def test_live_writes_result_without_token(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "fb_queue.csv"
            self.write_queue(path, [
                row(id="due", status="待發", publish_at="2026-11-05 17:00", type="text", caption=f"你好 {TOKEN}", account="111"),
                row(id="later", status="待發", publish_at="2026-11-05 17:10", type="text", caption="下一則", account="沒有"),
            ])
            g = FakeGraph()
            self.assertEqual(fb.main([], now=self.now, graph=g, queue_path=path, pause=0), 0)
            rows = {r["id"]: r for r in fb.read(path)}
            self.assertEqual(rows["due"]["status"], "已發")
            self.assertEqual(rows["due"]["post_id"], "111_777")
            self.assertNotIn(TOKEN, rows["due"]["note"])
            self.assertEqual(rows["later"]["status"], "失敗")
            self.assertNotIn(TOKEN, rows["later"]["note"])

    def test_reel_cap_leaves_row_pending(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "fb_queue.csv"
            rows = []
            for i in range(30):
                at = self.now - timedelta(minutes=20 * (i + 1))
                rows.append(row(id=f"old{i}", status="已發", publish_at=at.strftime("%Y-%m-%d %H:%M"), type="reel", account="爵士101", post_id=str(i)))
            rows.append(row(id="new", status="待發", publish_at="2026-11-05 17:00", type="reel", media="social/media/a.mp4", caption="x", account="爵士101"))
            self.write_queue(path, rows)
            g = FakeGraph()
            fb.main([], now=self.now, graph=g, queue_path=path, pause=0)
            self.assertEqual(g.uploads, [])
            self.assertEqual(g.posts, [])
            got = {r["id"]: r for r in fb.read(path)}
            self.assertEqual(got["new"]["status"], "待發")

    def test_capped_reels_do_not_block_text(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "fb_queue.csv"
            rows = []
            for i in range(30):
                at = self.now - timedelta(minutes=20 * (i + 1))
                rows.append(row(id=f"old{i}", status="已發", publish_at=at.strftime("%Y-%m-%d %H:%M"), type="reel", account="爵士101", post_id=str(i)))
            rows.append(row(id="reel", status="待發", publish_at="2026-11-05 17:00", type="reel", media="social/media/a.mp4", caption="x", account="爵士101"))
            rows.append(row(id="text", status="待發", publish_at="2026-11-05 17:10", type="text", caption="仍要發", account="爵士101"))
            self.write_queue(path, rows)
            g = FakeGraph()
            fb.main([], now=self.now, graph=g, queue_path=path, pause=0)
            self.assertEqual(g.uploads, [])
            self.assertEqual([p[0] for p in g.posts], ["111/feed"])
            got = {r["id"]: r for r in fb.read(path)}
            self.assertEqual(got["reel"]["status"], "待發")
            self.assertEqual(got["text"]["status"], "已發")

    def test_each_post_is_saved_before_the_next(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "fb_queue.csv"
            self.write_queue(path, [
                row(id="a", status="待發", publish_at="2026-11-05 17:00", type="text", caption="第一則", account="111"),
                row(id="b", status="待發", publish_at="2026-11-05 17:10", type="text", caption="第二則", account="111"),
            ])
            seen = {}
            queue = path

            class Spy(FakeGraph):
                def post(self, endpoint, token, **data):
                    if self.posts:
                        seen.update({r["id"]: r["status"] for r in fb.read(queue)})
                    return super().post(endpoint, token, **data)

            fb.main([], now=self.now, graph=Spy(), queue_path=path, pause=0)
            self.assertEqual(seen.get("a"), "已發")

    def test_check_lists_pages_not_tokens(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            status = Path(d) / "fb_status.txt"
            g = FakeGraph()
            self.assertEqual(fb.check(graph=g, queue_path=fb.QUEUE, status_path=status, now=self.now), 0)
            text = status.read_text(encoding="utf-8")
            self.assertIn("可以發粉專：是", text)
            self.assertIn("爵士101（111）", text)
            self.assertIn("佇列裡沒有待發的列", text)
            self.assertNotIn(TOKEN, text)

    def test_real_queue_main_does_not_call_graph(self):
        before = fb.QUEUE.read_bytes()

        class Boom(FakeGraph):
            def pages(self):
                raise AssertionError("不該查粉專")

            def post(self, *a, **k):
                raise AssertionError("不該發文")

        fb.main([], now=self.now, graph=Boom(), queue_path=fb.QUEUE, pause=0)
        self.assertEqual(fb.QUEUE.read_bytes(), before)


class WorkflowTests(unittest.TestCase):
    def test_dispatch_has_dry_run_and_does_not_touch_ig(self):
        text = (Path(__file__).resolve().parents[2] / ".github/workflows/fb-poster.yml").read_text(encoding="utf-8")
        self.assertIn("dry-run", text)
        self.assertIn("fb_publish.py --check", text)
        self.assertIn("secrets.META_USER_TOKEN", text)
        self.assertNotIn("ig_publish.py", text)
        self.assertNotIn("ig_queue.csv", text)
        self.assertNotIn("EAA", text)


if __name__ == "__main__":
    unittest.main()
