# -*- coding: utf-8 -*-
"""一次性脚本：驱动 Kimi WebBridge 截取 CETUS 各页面到 docs/screenshots/。"""
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

DAEMON = "http://127.0.0.1:10086/command"
SESSION = "cetus-readme-shots"
BASE = "http://localhost:5199"
OUT = Path(__file__).resolve().parent.parent / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("/architecture", "01-architecture.png", 3.0),
    ("/cloud/overview", "02-cloud-overview.png", 2.5),
    ("/cloud/decision", "03-cloud-decision.png", 2.5),
    ("/cloud/monitor", "04-cloud-monitor.png", 3.0),
    ("/cloud/lifecycle", "05-cloud-lifecycle.png", 2.5),
    ("/cloud/scene", "06-cloud-scene.png", 6.0),
    ("/edge/1", "07-edge-station.png", 3.0),
    ("/terminal/overview", "08-terminal-overview.png", 2.5),
    ("/terminal/USV-1", "09-terminal-vessel.png", 5.0),
]


def post(action, args):
    body = json.dumps({"action": action, "args": args, "session": SESSION}).encode("utf-8")
    req = urllib.request.Request(DAEMON, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ensure_daemon():
    try:
        post("list_tabs", {})
        return True
    except Exception:
        exe = Path.home() / ".kimi-webbridge" / "bin" / "kimi-webbridge.exe"
        subprocess.Popen([str(exe), "start"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(20):
            time.sleep(1)
            try:
                post("list_tabs", {})
                return True
            except Exception:
                continue
    return False


def main():
    if not ensure_daemon():
        print("DAEMON_FAIL")
        sys.exit(2)
    ok = 0
    for i, (route, name, wait) in enumerate(PAGES):
        args = {"url": BASE + route, "newTab": True}
        if i == 0:
            args["group_title"] = "CETUS README 截图"
        try:
            nav = post("navigate", args)
            time.sleep(wait)
            shot = post("screenshot", {"format": "png", "path": str(OUT / name)})
            size = shot.get("sizeBytes", 0)
            print(f"{name}: nav={nav.get('success')} size={size}")
            if size > 5000:
                ok += 1
        except Exception as e:
            print(f"{name}: ERROR {e}")
    print(f"OK {ok}/{len(PAGES)}")


if __name__ == "__main__":
    main()
