#!/usr/bin/env python3
"""YouTube の字幕を、画面なしで取って「[mm:ss] 文」のテキストにする。

    python3 -I yt_transcript.py <URL か 動画 ID>... [--lang ja] [--out DIR]

- yt-dlp で字幕(json3)を取る。動画そのものは落とさない
- 元の言語の字幕を選ぶ(手動 > 自動)。自動翻訳の字幕は選ばない
- 止められたら Chrome の cookie で 1 回だけ取り直す
- 標準ライブラリだけ。`python3 -I` で動く
"""

import argparse
import datetime
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlparse

YT_DLP_DEFAULT = "/opt/homebrew/bin/yt-dlp"
YT_DLP_TIMEOUT = 180  # 秒。キーチェーンの確認で止まったままにしない

# 行の切り方(秒)
MIN_LINE = 5.0  # 文の終わりでも、ここまでは次の文と同じ行にする
SOFT_MAX = 15.0  # 文が長いとき、ここを超えたら読点で切る
HARD_MAX = 25.0  # それでも切れないとき、字幕の行の切れ目で切る
UNPUNCT_MAX = 8.0  # 手動の字幕と句読点の無い自動字幕は、この長さで行の切れ目で切る
CHAPTER_SLACK = 1.0  # チャプターの時刻は秒単位。少し前から始まる文も新しい章に入れる

SENTENCE_END = "。．.!?！？…‥"
CLAUSE_END = "、，,;；:："
CLOSERS = "\"'”’」』）)】］]〉》"
NO_SPACE_AFTER = "。、．，！？…‥「『（【［〈《・"
NO_SPACE_BEFORE = "。、．，！？…‥」』）】］〉》・"

# cookie があれば通るかもしれない止められ方
BLOCKED = re.compile(
    r"sign in|not a bot|--cookies|http error 4(03|29)|too many requests|po[ _]token"
    r"|private video|members|age[- ]restricted|confirm your age|login required"
    r"|try again later",
    re.I,
)


# YouTube が作り直した自動字幕の印(URL の中)
REMADE = re.compile(r"([?&])variant=gemini(&|$)")


class Stop(Exception):
    """この動画は取れない。理由を出して次へ行く。"""

    def __init__(self, reason, blocked=False):
        super().__init__(reason)
        self.blocked = blocked


# ---------- 入力 ----------

def video_id(text):
    """URL か動画 ID から 11 文字の ID を取り出す。"""
    text = text.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", text):
        return text
    url = urlparse(text if "://" in text else "https://" + text)
    host = (url.hostname or "").lower()
    cand = None
    if host == "youtu.be":
        cand = url.path.strip("/").split("/")[0]
    elif host == "youtube.com" or host.endswith((".youtube.com", ".youtube-nocookie.com")):
        if url.path == "/watch":
            cand = (parse_qs(url.query).get("v") or [""])[0]
        else:
            m = re.match(r"/(?:shorts|live|embed|v)/([^/?#]+)", url.path)
            cand = m.group(1) if m else None
    if cand and re.fullmatch(r"[A-Za-z0-9_-]{11}", cand):
        return cand
    raise Stop("YouTube の URL か動画 ID ではない")


# ---------- yt-dlp ----------

def run_yt_dlp(yt_dlp, args, cookies):
    cmd = [yt_dlp, "--ignore-config", "--no-update", "--color", "never", "--no-progress",
           "--no-playlist", "--skip-download", "--ignore-no-formats-error",
           "--socket-timeout", "30"]
    if cookies:
        cmd += ["--cookies-from-browser", "chrome"]
    try:
        p = subprocess.run(cmd + args, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=YT_DLP_TIMEOUT)
    except FileNotFoundError:
        raise Stop(f"yt-dlp が無い({yt_dlp})。`brew install yt-dlp` か --yt-dlp で場所を指定")
    except subprocess.TimeoutExpired:
        raise Stop(f"yt-dlp が {YT_DLP_TIMEOUT} 秒たっても終わらない"
                   + ("(キーチェーンの確認が出ていないか見る)" if cookies else ""))
    return p


def why(stderr):
    """yt-dlp のエラーの行だけ抜く。"""
    lines = [l.strip() for l in stderr.splitlines() if l.strip()]
    errors = [l for l in lines if l.startswith("ERROR")]
    return " / ".join((errors or lines[-2:]))[:600] or "理由は出ていない"


def fetch_info(yt_dlp, vid, cookies):
    p = run_yt_dlp(yt_dlp, ["--dump-json", "--", f"https://www.youtube.com/watch?v={vid}"], cookies)
    try:
        info = json.loads(p.stdout)
    except ValueError:
        info = None
    if p.returncode != 0 or not isinstance(info, dict):
        raise Stop(why(p.stderr), blocked=bool(BLOCKED.search(p.stderr)))
    return info, p.stderr


def fetch_subs(yt_dlp, info, work, track, cookies):
    """字幕を json3 で落とす。→ (中身, YouTube が作り直した版か)

    自動字幕には、YouTube が作り直した版(URL に variant=gemini)が返る動画がある。
    言葉が抜けたり変わったりしていて、画面の「文字起こし」とは別物なので、
    variant=gemini を外して画面と同じ版を取る。それで取れない時だけ、作り直した版を使う。
    (2026-11-23 に 2 本で確かめた: 外すと画面の文字起こしと 100% 同じ)
    """
    formats = (info.get("subtitles" if track["manual"] else "automatic_captions") or {}).get(track["key"]) or []
    remade = not track["manual"] and any(REMADE.search(f.get("url") or "") for f in formats)
    key = track["key"] if re.fullmatch(r"[A-Za-z0-9_-]+", track["key"]) else re.escape(track["key"])
    info_path = work / "info.json"
    last = None
    for strip in ([True, False] if remade else [False]):
        originals = [f.get("url") for f in formats]
        if strip:
            for f in formats:
                f["url"] = REMADE.sub(r"\1", f.get("url") or "").rstrip("?&")
        info_path.write_text(json.dumps(info), encoding="utf-8")
        for f, url in zip(formats, originals):
            f["url"] = url
        for old in work.glob("*.json3"):
            old.unlink()
        p = run_yt_dlp(yt_dlp, [
            "--load-info-json", str(info_path),
            "--write-subs" if track["manual"] else "--write-auto-subs",
            "--sub-langs", key, "--sub-format", "json3",
            "-P", str(work), "-o", "sub.%(ext)s",
        ], cookies)
        files = sorted(work.glob("*.json3"))
        if p.returncode != 0 or not files:
            last = Stop(why(p.stderr), blocked=bool(BLOCKED.search(p.stderr)))
            continue
        try:
            data = json.loads(files[0].read_text(encoding="utf-8"))
        except ValueError:
            # 止められると、字幕の代わりに空や HTML が返ることがある
            last = Stop("字幕のファイルが JSON ではない", blocked=True)
            continue
        if not tokens_from(data):
            last = Stop("字幕の中身が空", blocked=True)
            continue
        return data, remade and not strip
    raise last


# ---------- 字幕を選ぶ ----------

def base(lang):
    return lang.split("-")[0].lower()


def list_tracks(info):
    """(手動の字幕, 自動の字幕, 自動翻訳しか無い言語)。自動は元の音声を聞き取った物だけ。"""
    manual = {k: k for k, v in (info.get("subtitles") or {}).items() if v and k != "live_chat"}
    auto, translated = {}, set()
    captions = info.get("automatic_captions") or {}
    for key in captions:
        if key.endswith("-orig"):
            auto[key[: -len("-orig")]] = key
    for key, formats in captions.items():
        if key.endswith("-orig") or key in auto:
            continue
        url = next((f.get("url") for f in formats or [] if f.get("url")), "")
        if "tlang" in parse_qs(urlparse(url).query):
            translated.add(key)
        else:
            auto[key] = key
    return manual, auto, translated


def original_language(info, auto):
    """話されている言語。自動字幕が 1 つならその言語(動画の設定より確か)。"""
    if len(auto) == 1:
        return next(iter(auto))
    lang = info.get("language")  # 吹き替えのある動画は自動字幕が言語の数だけある
    if not lang:
        for f in info.get("formats") or []:
            if f.get("language") and f.get("language_preference") == 10:
                return f["language"]
    return lang


def shown(key):
    """字幕の名前を見せる形にする。YouTube が付けた枝番(ja-ZxwNgMOn5iM)は落とす。"""
    return key if re.fullmatch(r"[A-Za-z]{2,3}(-[A-Za-z0-9]{2,4})?", key) else base(key)


def match(tracks, lang):
    """lang と同じ言語の字幕の名前。ぴったり > 同じ言語の別の地域。"""
    if lang in tracks:
        return lang
    same = sorted(k for k in tracks if base(k) == base(lang))
    return same[0] if same else None


def choose_track(info, want):
    manual, auto, translated = list_tracks(info)
    orig = original_language(info, auto)
    have = f"ある字幕 — 手動: {', '.join(sorted(manual)) or 'なし'} / 自動: {', '.join(sorted(auto)) or 'なし'}"
    if not manual and not auto:
        raise Stop("字幕が無い" + ("(ライブ配信中か配信前)" if info.get("live_status") in ("is_live", "is_upcoming") else ""))

    lang = want or orig
    if not lang:
        if len(manual) == 1:
            lang = next(iter(manual))
        else:
            raise Stop(f"元の言語が分からない。--lang で指定する。{have}")

    k = match(manual, lang)
    if k:
        return {"manual": True, "key": manual[k], "label": f"手動({shown(k)})"}
    k = match(auto, lang)
    if k:
        label = f"自動({k})"
        if orig and base(k) != base(orig):
            label += f"。吹き替え音声の字幕(元の言語は {orig})"
        return {"manual": False, "key": auto[k], "label": label}
    if want and match(dict.fromkeys(translated), want):
        raise Stop(f"{want} は自動翻訳しか無いので使わない。元の言語は {orig or '不明'}。{have}")
    if want:
        raise Stop(f"{want} の字幕が無い。{have}")
    raise Stop(f"元の言語({orig})の字幕が無い。別の言語でよければ --lang で指定する。{have}")


# ---------- json3 を文にする ----------

def tokens_from(data):
    """json3 → [開始 ms, 文字, 字幕の行の頭か] の並び。"""
    out = []
    line_start = True
    for ev in data.get("events") or []:
        t0 = ev.get("tStartMs") or 0
        if not ev.get("aAppend"):
            line_start = True  # 追記でないイベントは新しい行
        for seg in ev.get("segs") or []:
            text = (seg.get("utf8") or "").replace("\u200b", "").replace("\xa0", " ")
            for i, part in enumerate(text.split("\n")):
                if i:
                    line_start = True  # 自動字幕は「改行だけの追記」で行が変わる
                if part.strip():
                    out.append([t0 + (seg.get("tOffsetMs") or 0), part, line_start])
                    line_start = False
    return out


def is_cjk(ch):
    return ch >= "\u2e80"


def is_ascii_word(ch):
    return ch.isascii() and ch.isalnum()


def joiner(left, right, word_timed, spaced):
    """字幕の行と行のつなぎ目に入れる物。"""
    a, b = left.rstrip()[-1:], right.lstrip()[:1]
    if not a or not b:
        return ""
    if word_timed:  # 自動字幕: 単語の間に空白を置く言語と、英数字どうしの間だけ空白
        return " " if spaced or (is_ascii_word(a) and is_ascii_word(b)) else ""
    if is_cjk(a) and is_cjk(b) and (a in NO_SPACE_AFTER or b in NO_SPACE_BEFORE):
        return ""
    return " "  # 手動の字幕は行ごとに句が切れているので、空白でつなぐ


def ends_with(text, marks):
    return text.rstrip().rstrip(CLOSERS).endswith(tuple(marks))


def build_lines(data, chapters):
    """→ [(開始秒, 文, チャプター番号)]。チャプターをまたいで行をつながない。"""
    toks = tokens_from(data)
    if not toks:
        return []
    word_timed = any("tOffsetMs" in s for ev in data.get("events") or [] for s in ev.get("segs") or [])
    inner = [x for _, x, first in toks if not first]
    spaced = sum(1 for x in inner if x[0].isspace()) * 2 > len(inner)
    minutes = max((toks[-1][0] - toks[0][0]) / 60000, 1)
    punctuated = sum(1 for _, x, _ in toks if ends_with(x, SENTENCE_END)) >= minutes * 2
    # 句読点のある自動字幕は、行の切れ目が文の途中に来るので、文の終わりを待つ。
    # 手動の字幕と、句読点の無い自動字幕は、行の切れ目で切ってよい
    loose = not (word_timed and punctuated)
    cap = UNPUNCT_MAX if loose else HARD_MAX
    starts = [c["start_time"] for c in chapters]

    def chapter_of(sec):
        n = -1
        for i, s in enumerate(starts):
            if sec >= s - CHAPTER_SLACK:
                n = i
        return n

    # 1. 文ごとに切る。長すぎる文は読点か、字幕の行の切れ目で切る
    units, cur, cur_t, prev = [], "", None, ""
    for t, text, first in toks:
        sec = t / 1000
        if cur and first and (sec - cur_t >= cap or (loose and chapter_of(sec) != chapter_of(cur_t))):
            units.append((cur_t, cur))
            cur, cur_t = "", None
        if cur_t is None:
            cur_t = sec
        cur += (joiner(prev, text, word_timed, spaced) if first else "") + text
        prev = text
        if ends_with(text, SENTENCE_END) or (sec - cur_t >= SOFT_MAX and ends_with(text, CLAUSE_END)):
            units.append((cur_t, cur))
            cur, cur_t = "", None
    if cur:
        units.append((cur_t, cur))

    # 2. 短い文は、同じチャプターの中で前の行につなぐ
    lines = []
    for t, text in units:
        ch = chapter_of(t)
        if lines and lines[-1][2] == ch and t - lines[-1][0] < MIN_LINE:
            lines[-1] = (lines[-1][0], lines[-1][1] + text, ch)
        else:
            lines.append((t, text, ch))
    return [(t, re.sub(r"\s+", " ", text).strip(), ch) for t, text, ch in lines]


# ---------- 出力 ----------

def clock(sec, hours):
    sec = int(sec)
    h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return f"{h}:{m:02d}:{s:02d}" if hours else f"{m:02d}:{s:02d}"


def render(info, vid, track, lines, chapters):
    dur = info.get("duration") or 0
    hours = dur >= 3600 or (lines and lines[-1][0] >= 3600)
    date = info.get("upload_date") or ""
    one_line = lambda x: " ".join(str(x or "").split())
    head = [
        f"題: {one_line(info.get('title'))}",
        f"チャンネル: {one_line(info.get('channel') or info.get('uploader'))}",
        f"長さ: {clock(dur, dur >= 3600)}",
    ]
    if re.fullmatch(r"\d{8}", date):
        head.append(f"公開日: {date[:4]}-{date[4:6]}-{date[6:]}")
    head += [
        f"URL: https://www.youtube.com/watch?v={vid}",
        f"取得日: {datetime.date.today().isoformat()}",
        f"字幕: {track['label']}",
        "----",
    ]
    body, last = [], None
    for t, text, ch in lines:
        if ch != last and ch >= 0:
            body += ["", f"## {one_line(chapters[ch].get('title'))}".rstrip()]
        elif last is None:
            body.append("")
        last = ch
        body.append(f"[{clock(t, hours)}] {text}")
    return "\n".join(head + body) + "\n"


def get_one(yt_dlp, vid, want, cookies, keep_raw):
    """1 本取る。→ (info, 字幕の種類, 行, チャプター)"""
    work = Path(tempfile.mkdtemp(prefix=f"youtube-transcript-{vid}-"))  # 落とした物だけを置く空のフォルダ
    try:
        info, warnings = fetch_info(yt_dlp, vid, cookies)
        try:
            track = choose_track(info, want)
        except Stop as e:
            # 動画が見られない時も yt-dlp は警告だけで返す。止められていると、字幕の一覧が欠けて返る
            said = " / ".join(l[len("WARNING: [youtube]"):].strip() for l in warnings.splitlines()
                              if l.startswith("WARNING: [youtube]"))
            if said and not info.get("formats"):
                e = Stop(f"動画を見られない — {said[:400]}", blocked=bool(BLOCKED.search(said)))
            e.blocked = e.blocked or bool(re.search(r"po[ _]token|sign in|not a bot", warnings, re.I))
            raise e
        data, remade = fetch_subs(yt_dlp, info, work, track, cookies)
        if remade:
            track["label"] += "。YouTube が作り直した版(画面の文字起こしと言葉が違うことがある)"
        chapters = sorted((c for c in info.get("chapters") or [] if isinstance(c.get("start_time"), (int, float))),
                          key=lambda c: c["start_time"])
        return info, track, build_lines(data, chapters), chapters
    finally:
        if keep_raw:
            print(f"  元のデータ: {work}", file=sys.stderr)
        else:
            shutil.rmtree(work, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser(description="YouTube の字幕を取って「[mm:ss] 文」のテキストにする")
    ap.add_argument("videos", nargs="+", metavar="URL", help="YouTube の URL か動画 ID(いくつでも)")
    ap.add_argument("--lang", help="字幕の言語(例: ja, en)。省くと元の言語")
    ap.add_argument("--out", default="transcripts", help="保存先のフォルダ(省くと ./transcripts)")
    ap.add_argument("--no-cookies", action="store_true", help="止められても Chrome の cookie で取り直さない")
    ap.add_argument("--keep-raw", action="store_true", help="yt-dlp が落とした物(info.json・json3)を消さずに残す")
    ap.add_argument("--yt-dlp", default=None, help=f"yt-dlp の場所(省くと {YT_DLP_DEFAULT} か PATH)")
    args = ap.parse_args()

    yt_dlp = args.yt_dlp or (YT_DLP_DEFAULT if Path(YT_DLP_DEFAULT).exists() else shutil.which("yt-dlp") or "yt-dlp")
    out = Path(args.out).expanduser()
    failed = 0
    for raw in args.videos:
        try:
            vid = video_id(raw)
            try:
                got = get_one(yt_dlp, vid, args.lang, False, args.keep_raw)
            except Stop as first:
                if not first.blocked or args.no_cookies:
                    raise
                print(f"止められた({vid}): {first}\n  → Chrome の cookie で取り直す", file=sys.stderr)
                try:
                    got = get_one(yt_dlp, vid, args.lang, True, args.keep_raw)
                except Stop as second:
                    raise Stop(f"Chrome の cookie でも取れない — {second}"
                               + ("" if str(second) == str(first) else f"(cookie なしの時: {first})"))
            info, track, lines, chapters = got
            out.mkdir(parents=True, exist_ok=True)
            path = out / f"transcript-{vid}.txt"
            again = path.exists()
            path.write_text(render(info, vid, track, lines, chapters), encoding="utf-8")
            print(f"保存{'(上書き)' if again else ''}: {path.resolve()}")
            print(f"  {' '.join(str(info.get('title') or '').split())} / {clock(info.get('duration') or 0, (info.get('duration') or 0) >= 3600)}"
                  f" / 字幕: {track['label']} / {len(lines)} 行"
                  + (f" / チャプター {len(chapters)}" if chapters else ""))
        except Stop as e:
            failed += 1
            print(f"失敗: {raw} — {e}", file=sys.stderr)
        except Exception as e:  # 1 本の想定外で、残りの動画を止めない
            failed += 1
            print(f"失敗: {raw} — 想定外のエラー {type(e).__name__}: {e}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
