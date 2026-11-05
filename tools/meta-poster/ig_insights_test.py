"""不打網路：帳號整理、指標略過、權限失敗、輸出不含 token、workflow 只有手動觸發。"""
import csv
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ig_insights as ig
import meta

TPE = timezone(timedelta(hours=8))
TOKEN = "SECRET_TOKEN_XYZ_123456"
USER = "USER_TOKEN_ABCDEFGH"
NOW = datetime(2026, 11, 5, 11, 54, tzinfo=TPE)
ROOT = Path(__file__).resolve().parents[2]
WF = ROOT / ".github" / "workflows" / "ig-insights.yml"


def page(ig_id, username, connected=False, token=TOKEN, name=None):
    key = "connected_instagram_account" if connected else "instagram_business_account"
    return {
        "id": "p_" + ig_id,
        "name": name or ("粉專" + username),
        "access_token": token,
        key: {"id": ig_id, "username": username},
    }


def media(mid, **kwargs):
    row = {
        "id": mid,
        "permalink": f"https://www.instagram.com/p/{mid}/",
        "timestamp": "2026-11-01T00:00:00+0000",
        "media_type": "IMAGE",
        "media_product_type": "FEED",
        "caption": "文案",
        "like_count": 1,
        "comments_count": 0,
    }
    row.update(kwargs)
    return row


class FakeGraph:
    def __init__(self):
        self.gets = []
        self.perms = [
            {"permission": "pages_show_list", "status": "granted"},
            {"permission": "pages_read_engagement", "status": "granted"},
            {"permission": "instagram_basic", "status": "granted"},
            {"permission": "instagram_manage_insights", "status": "granted"},
        ]
        self.pages = []
        self.profiles = {}
        self.media = {}
        self.metrics = {}
        self.total_value_ids = set()
        self.bad_metrics = set()
        self.block_ids = set()
        self.owner = {}
        self.deny_metrics = set()
        self.block_metrics = set()
        self.rate_limit = False
        self.fail_connected = False
        self.require_metric_type = False
        self.media_page = 50

    def get(self, path, token=None, **params):
        path = str(path)
        self.gets.append((path, dict(params)))
        if "access_token" in params or path.startswith("http"):
            raise AssertionError(path)
        if path == "me/permissions":
            return {"data": self.perms}
        if path == "me/accounts":
            fields = params.get("fields") or ""
            if self.fail_connected and "connected_instagram_account" in fields:
                raise RuntimeError("(#100) nonexisting field (connected_instagram_account)")
            return {"data": self.pages}
        if path.endswith("/insights"):
            return self._insights(path.split("/")[0], params)
        if path.endswith("/media"):
            return self._media(path.split("/")[0], params)
        if path in self.profiles:
            return self.profiles[path]
        raise RuntimeError(f"unexpected path {path}")

    def _insights(self, media_id, params):
        if self.require_metric_type and "metric_type" not in params:
            raise RuntimeError("metric_type is required")
        if self.rate_limit:
            raise RuntimeError("(#4) Application request limit reached")
        owner = self.owner.get(media_id)
        if owner in self.block_ids:
            raise RuntimeError(
                "(#200) Requires instagram_manage_insights permission access_token=" + TOKEN
            )
        metrics = [m for m in str(params.get("metric") or "").split(",") if m]
        if any(m in self.block_metrics for m in metrics):
            raise RuntimeError("(#200) Requires instagram_manage_insights permission")
        if any(m in self.deny_metrics for m in metrics):
            raise RuntimeError("(#10) Application does not have permission for this action")
        bad = [m for m in metrics if m in self.bad_metrics]
        if bad:
            joined = ", ".join(bad)
            raise RuntimeError(
                f"(#100) The following metrics ({joined}) are not supported for this media product type"
            )
        data = []
        spec = self.metrics.get(media_id, {})
        for name in metrics:
            if name not in spec:
                continue
            if media_id in self.total_value_ids:
                data.append({"name": name, "period": "lifetime", "total_value": {"value": spec[name]}})
            else:
                data.append({"name": name, "period": "lifetime", "values": [{"value": spec[name]}]})
        return {"data": data}

    def _media(self, ig_id, params):
        items = self.media.get(ig_id, [])
        start = int(params.get("after") or 0)
        limit = min(int(params.get("limit") or 50), self.media_page)
        chunk = items[start : start + limit]
        body = {"data": chunk}
        nxt = start + limit
        if nxt < len(items):
            body["paging"] = {
                "cursors": {"after": str(nxt)},
                "next": "https://graph.facebook.com/v21.0/x/media?access_token=" + TOKEN + "&after=" + str(nxt),
            }
        return body


def add_account(graph, ig_id, username, followers, media_count, posts, connected=False):
    graph.pages.append(page(ig_id, username, connected=connected))
    graph.profiles[ig_id] = {
        "username": username,
        "followers_count": followers,
        "media_count": media_count,
    }
    graph.media[ig_id] = posts
    for post in posts:
        graph.owner[post["id"]] = ig_id


def base_metrics(views, **extra):
    data = {
        "views": views,
        "reach": views + 1,
        "saved": 3,
        "shares": 4,
        "total_interactions": 5,
        "follows": 2,
    }
    data.update(extra)
    return data


def run_in(tmp, graph, limit=100):
    code = ig.run(graph, tmp, NOW, limit, USER)
    csv_path = tmp / "ig_insights_20261105.csv"
    summary_path = tmp / "ig_insights_summary.md"
    return code, csv_path, summary_path


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def insight_paths(graph):
    return [path for path, _params in graph.gets if path.endswith("/insights")]


class PureTests(unittest.TestCase):
    def test_parse_limit(self):
        self.assertEqual(ig.parse_limit("100"), 100)
        self.assertEqual(ig.parse_limit(" 15 "), 15)
        self.assertEqual(ig.parse_limit("9999"), 200)
        self.assertEqual(ig.parse_limit("0"), 100)
        self.assertEqual(ig.parse_limit("100; rm -rf /"), 100)
        self.assertEqual(ig.parse_limit(""), 100)
        self.assertEqual(ig.parse_limit(None), 100)

    def test_metric_names_and_permission_class(self):
        msg = "(#100) The following metrics (plays, follows) are not supported"
        self.assertEqual(
            ig.unsupported_metric_names(msg, ["views", "plays", "follows", "reach"]),
            ["plays", "follows"],
        )
        listed = "(#100) metric plays is not supported. Must be one of reach, saved, views"
        self.assertEqual(
            ig.unsupported_metric_names(listed, ["plays", "reach", "views", "saved"]),
            ["plays"],
        )
        self.assertTrue(ig.is_account_permission("(#200) Requires instagram_manage_insights permission"))
        self.assertFalse(ig.is_account_permission("(#100) The metric plays is not supported"))
        self.assertFalse(ig.is_account_permission("(#10) Application does not have permission for this action"))

    def test_next_after_never_returns_the_url(self):
        url = "https://graph.facebook.com/v21.0/1/media?access_token=" + TOKEN + "&after=CURSOR1"
        self.assertEqual(ig.next_after({"paging": {"next": url}}), "CURSOR1")
        prefer = {
            "paging": {
                "cursors": {"after": "C2"},
                "next": "https://example.test?access_token=" + TOKEN + "&after=NOPE",
            }
        }
        self.assertEqual(ig.next_after(prefer), "C2")
        self.assertIsNone(ig.next_after({"paging": {"cursors": {"after": "END"}}}))

    def test_ig_from_pages_dedupes_and_keeps_connected(self):
        rows = ig.ig_from_pages(
            [
                {
                    "id": "1",
                    "name": "A",
                    "access_token": "t" * 12,
                    "instagram_business_account": {"id": "9", "username": "jazz101tw"},
                    "connected_instagram_account": {"id": "9", "username": "jazz101tw"},
                }
            ]
        )
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["link"], "instagram_business_account")
        only = ig.ig_from_pages(
            [
                {
                    "id": "2",
                    "name": "B",
                    "access_token": "u" * 12,
                    "connected_instagram_account": {"id": "8", "username": "only.connected"},
                }
            ]
        )
        self.assertEqual(only[0]["username"], "only.connected")
        self.assertEqual(only[0]["link"], "connected_instagram_account")

    def test_guard_blocks_non_get(self):
        calls = []

        def orig(self, method, url, **kwargs):
            calls.append(method)
            return "ok"

        wrapped = ig.guarded_request(orig)

        class Session:
            pass

        session = Session()
        self.assertEqual(wrapped(session, "GET", "https://example.test"), "ok")
        with self.assertRaises(RuntimeError):
            wrapped(session, "POST", "https://graph.facebook.com/v21.0/me/media")
        self.assertEqual(calls, ["GET"])

    def test_real_graph_retries_and_scrubs(self):
        calls = {"n": 0}

        def flaky(path, token, **params):
            calls["n"] += 1
            if calls["n"] < 3:
                raise RuntimeError("(#4) Application request limit reached access_token=" + TOKEN)
            return {"ok": True}

        sleeps = []
        graph = ig.RealGraph(get_fn=flaky, sleep_fn=sleeps.append)
        self.assertEqual(graph.get("me", TOKEN), {"ok": True})
        self.assertEqual(calls["n"], 3)
        self.assertEqual(len(sleeps), 2)

        def boom(path, token, **params):
            raise RuntimeError("nope access_token=" + TOKEN)

        sleeps = []
        graph = ig.RealGraph(get_fn=boom, sleep_fn=sleeps.append)
        with self.assertRaises(RuntimeError) as caught:
            graph.get("me", TOKEN)
        self.assertEqual(sleeps, [])
        self.assertNotIn("SECRET_TOKEN", str(caught.exception))
        self.assertIn("***", str(caught.exception))

    def test_main_requires_token(self):
        old = meta.TOKEN
        meta.TOKEN = ""
        try:
            self.assertEqual(ig.main([]), 1)
        finally:
            meta.TOKEN = old

    def test_script_and_workflow_are_readonly(self):
        src = Path(ig.__file__).read_text(encoding="utf-8")
        for bad in ("requests.post", "requests.put", "requests.patch", "requests.delete", "meta.post("):
            self.assertNotIn(bad, src)
        self.assertIn("guard_get_only()", src)
        text = WF.read_text(encoding="utf-8")
        self.assertIn("name: IG 數據抓取（只讀）", text)
        head = text.split("jobs:", 1)[0]
        self.assertIn("workflow_dispatch:", head)
        self.assertNotRegex(head, r"(?m)^  push:")
        self.assertNotRegex(head, r"(?m)^  schedule:")
        self.assertNotRegex(head, r"(?m)^  pull_request:")
        self.assertIn("contents: write", text)
        self.assertIn("secrets.META_USER_TOKEN", text)
        self.assertIn("git add -- social/insights", text)
        self.assertNotIn("git add -A", text)
        self.assertNotIn("git add .", text)
        for line in text.splitlines():
            if "echo" in line and "TOKEN" in line:
                self.fail(line)


class FetchTests(unittest.TestCase):
    def setUp(self):
        import tempfile

        self._dir = tempfile.TemporaryDirectory()
        self.tmp = Path(self._dir.name)

    def tearDown(self):
        self._dir.cleanup()

    def test_summary_ranking_caption_and_missing_accounts(self):
        graph = FakeGraph()
        graph.bad_metrics.add("plays")
        long_caption = "最高\n" + ("字" * 90)
        posts = [
            media("r1", media_type="VIDEO", media_product_type="REELS", caption="甲", timestamp="2026-11-01T01:00:00+0000", like_count=0),
            media("r2", media_type="VIDEO", media_product_type="REELS", caption="乙", timestamp="2026-11-02T01:00:00+0000"),
            media("r3", media_type="VIDEO", media_product_type="REELS", caption="丙", timestamp="2026-11-03T01:00:00+0000"),
            media("i1", caption="丁", timestamp="2026-10-01T01:00:00+0000"),
            media("i2", caption="最低", timestamp="2026-10-02T01:00:00+0000"),
            media("c1", media_type="CAROUSEL_ALBUM", caption=long_caption, timestamp="2026-11-04T01:00:00+0000"),
        ]
        add_account(graph, "igjazz", "jazz101tw", 1000, 20, posts)
        add_account(graph, "igother", "other.ig", 3, 0, [])
        views = {"r1": 100, "r2": 50, "r3": 10, "i1": 5, "i2": 1, "c1": 500}
        for mid, count in views.items():
            extra = {}
            if mid.startswith("r"):
                extra = {"ig_reels_avg_watch_time": 1500, "ig_reels_video_view_total_time": 9000}
            graph.metrics[mid] = base_metrics(count, **extra)
        graph.total_value_ids.add("c1")
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        rows = read_csv(csv_path)
        by_id = {row["id"]: row for row in rows}
        self.assertEqual(list(by_id), ["r1", "r2", "r3", "i1", "i2", "c1"])
        self.assertEqual(by_id["c1"]["views"], "500")
        self.assertEqual(by_id["c1"]["followers_count"], "1000")
        self.assertEqual(by_id["c1"]["media_count"], "20")
        self.assertEqual(by_id["r1"]["like_count"], "0")
        self.assertEqual(by_id["r1"]["comments_count"], "0")
        self.assertEqual(by_id["r1"]["plays"], "")
        self.assertEqual(by_id["r1"]["ig_reels_avg_watch_time"], "1500")
        self.assertEqual(by_id["i1"]["ig_reels_avg_watch_time"], "")
        self.assertEqual(by_id["c1"]["follows"], "2")
        self.assertEqual(len(by_id["c1"]["caption"]), 80)
        self.assertTrue(by_id["c1"]["caption"].startswith("最高 "))
        self.assertNotIn("\n", by_id["c1"]["caption"])
        self.assertIn("略過 plays", by_id["r1"]["insights_note"])
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("Reels 平均觀看：53.3", text)
        self.assertIn("- 追蹤：1,000", text)
        top, bottom = text.split("觀看前 5：", 1)[1].split("觀看後 3：", 1)
        self.assertIn("1. 500 次", top)
        self.assertIn("FEED/CAROUSEL_ALBUM", top)
        self.assertIn("1. 1 次", bottom)
        self.assertNotIn("500 次", bottom.split("##", 1)[0])
        status = text.split("狀態：", 1)[1].split("\n", 1)[0]
        self.assertIn("art101.tw", status)
        self.assertIn("reading.after", status)
        self.assertIn("untold.trip0", status)
        self.assertNotIn("jazz101tw", status)
        self.assertIn("plays×3", status)
        self.assertNotIn("plays", by_id["i1"]["insights_note"])
        self.assertIn("不在關心清單、但權杖看得到：other.ig", text)
        self.assertIn("數據權限：有", text)
        blob = csv_path.read_text(encoding="utf-8-sig") + text
        self.assertNotIn(TOKEN, blob)
        self.assertNotIn(USER, blob)
        self.assertNotIn("access_token=", blob)
        image_calls = [params["metric"] for path, params in graph.gets if path.startswith("i1/insights")]
        self.assertTrue(all("ig_reels" not in metric for metric in image_calls))
        reel_calls = [params["metric"] for path, params in graph.gets if path.startswith("r1/insights")]
        self.assertTrue(any("ig_reels_avg_watch_time" in metric for metric in reel_calls))
        self.assertTrue(all(not path.startswith("http") for path, _params in graph.gets))

    def test_pagination_and_limit(self):
        graph = FakeGraph()
        graph.media_page = 2
        posts = [media(f"m{i}", caption=str(i)) for i in range(5)]
        add_account(graph, "igjazz", "jazz101tw", 10, 5, posts)
        for post in posts:
            graph.metrics[post["id"]] = base_metrics(1)
        code, csv_path, _summary = run_in(self.tmp, graph, limit=100)
        self.assertEqual(code, 0)
        self.assertEqual(len(read_csv(csv_path)), 5)
        media_gets = [params for path, params in graph.gets if path.endswith("/media")]
        self.assertEqual([params.get("after") for params in media_gets], [None, "2", "4"])
        blob = csv_path.read_text(encoding="utf-8-sig")
        self.assertNotIn(TOKEN, blob)
        self.assertNotIn("graph.facebook.com/v21.0/x/media", blob)

        graph = FakeGraph()
        posts = [media(f"n{i}") for i in range(5)]
        add_account(graph, "igjazz", "jazz101tw", 10, 5, posts)
        for post in posts:
            graph.metrics[post["id"]] = base_metrics(1)
        _code, csv_path, _summary = run_in(self.tmp, graph, limit=2)
        self.assertEqual([row["id"] for row in read_csv(csv_path)], ["n0", "n1"])
        self.assertEqual(len([path for path, _params in graph.gets if path.endswith("/media")]), 1)

    def test_account_permission_stops_that_account_only(self):
        graph = FakeGraph()
        graph.block_ids.add("igA")
        add_account(graph, "igA", "jazz101tw", 10, 2, [media("a1"), media("a2")])
        add_account(graph, "igB", "art101.tw", 8, 1, [media("b1")])
        graph.metrics["b1"] = base_metrics(7)
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        rows = {row["id"]: row for row in read_csv(csv_path)}
        self.assertEqual(rows["a1"]["views"], "")
        self.assertEqual(rows["a1"]["like_count"], "1")
        self.assertIn("instagram_manage_insights", rows["a1"]["insights_note"])
        self.assertEqual(rows["b1"]["views"], "7")
        paths = insight_paths(graph)
        self.assertEqual(paths.count("a1/insights"), 1)
        self.assertNotIn("a2/insights", paths)
        self.assertIn("b1/insights", paths)
        blob = csv_path.read_text(encoding="utf-8-sig") + summary_path.read_text(encoding="utf-8")
        self.assertNotIn(TOKEN, blob)
        self.assertNotIn(USER, blob)
        self.assertIn("insights 失敗", summary_path.read_text(encoding="utf-8"))

    def test_core_permission_skips_do_not_fetch_the_next_media(self):
        graph = FakeGraph()
        graph.deny_metrics.update({"views", "reach"})
        add_account(graph, "igA", "jazz101tw", 10, 2, [media("a1", like_count=4), media("a2")])
        for mid in ("a1", "a2"):
            graph.metrics[mid] = base_metrics(5, saved=8)
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        rows = {row["id"]: row for row in read_csv(csv_path)}
        self.assertEqual(rows["a1"]["views"], "")
        self.assertEqual(rows["a1"]["saved"], "8")
        self.assertEqual(rows["a2"]["views"], "")
        self.assertNotIn("a2/insights", insight_paths(graph))
        self.assertIn("insights 失敗", summary_path.read_text(encoding="utf-8"))

    def test_optional_metric_permission_does_not_stop_the_account(self):
        graph = FakeGraph()
        graph.block_metrics.add("follows")
        add_account(graph, "igA", "jazz101tw", 10, 2, [media("a1"), media("a2")])
        graph.metrics["a1"] = base_metrics(6)
        graph.metrics["a2"] = base_metrics(4)
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        rows = {row["id"]: row for row in read_csv(csv_path)}
        self.assertEqual(rows["a1"]["views"], "6")
        self.assertEqual(rows["a2"]["views"], "4")
        self.assertIn("略過 follows", rows["a1"]["insights_note"])
        paths = insight_paths(graph)
        self.assertIn("a1/insights", paths)
        self.assertIn("a2/insights", paths)
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("follows×2", text)
        self.assertNotIn("insights 失敗", text)

    def test_rate_limit_does_not_split_into_more_calls(self):
        graph = FakeGraph()
        graph.rate_limit = True
        add_account(graph, "igA", "jazz101tw", 10, 2, [media("a1"), media("a2")])
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        self.assertEqual(insight_paths(graph), ["a1/insights"])
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("(#4)", text)
        self.assertEqual(len(read_csv(csv_path)), 2)

    def test_metric_type_retry(self):
        graph = FakeGraph()
        graph.require_metric_type = True
        add_account(graph, "igA", "jazz101tw", 10, 1, [media("a1")])
        graph.metrics["a1"] = base_metrics(11)
        code, csv_path, _summary = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        self.assertEqual(read_csv(csv_path)[0]["views"], "11")
        typed = [params for path, params in graph.gets if path == "a1/insights" and params.get("metric_type") == "total_value"]
        self.assertTrue(typed)

    def test_connected_account_and_field_fallback(self):
        graph = FakeGraph()
        add_account(graph, "igC", "only.connected", 4, 0, [], connected=True)
        code, _csv, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("only.connected", text)
        self.assertIn("connected_instagram_account", text)

        graph = FakeGraph()
        graph.fail_connected = True
        add_account(graph, "igjazz", "jazz101tw", 4, 0, [])
        code, _csv, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("jazz101tw", text)
        self.assertIn("connected_instagram_account 讀不到", text)

    def test_empty_pages_lists_every_interest_account(self):
        graph = FakeGraph()
        code, csv_path, summary_path = run_in(self.tmp, graph)
        self.assertEqual(code, 0)
        text = summary_path.read_text(encoding="utf-8")
        status = text.split("狀態：", 1)[1].split("\n", 1)[0]
        for handle in ig.INTEREST:
            self.assertIn(handle, status)
        self.assertIn("權杖看得到的 IG：0 個", text)
        with csv_path.open(encoding="utf-8-sig", newline="") as fh:
            self.assertEqual(next(csv.reader(fh)), ig.COLUMNS)

    def test_discovery_failure_is_written_and_scrubbed(self):
        class Boom(FakeGraph):
            def get(self, path, token=None, **params):
                if path == "me/permissions":
                    raise RuntimeError("失敗 access_token=" + USER)
                return super().get(path, token, **params)

        code, csv_path, summary_path = run_in(self.tmp, Boom())
        self.assertEqual(code, 1)
        text = summary_path.read_text(encoding="utf-8")
        self.assertIn("抓取中斷", text)
        self.assertNotIn(USER, text)
        self.assertNotIn(USER, csv_path.read_text(encoding="utf-8-sig"))
        self.assertIn("***", text)


if __name__ == "__main__":
    unittest.main()
