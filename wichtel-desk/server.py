"""Local web server for the Wichtel RFP desk (stdlib only, binds to 127.0.0.1).

    uv run --no-sync python -X utf8 wichtel/server.py   ->  http://127.0.0.1:8765

POST /api/run {"rfp": "..."} answers with a text/event-stream of swarm events.
"""
import json
import os
import pathlib
import queue
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from swarm import roster, run_swarm

HERE = pathlib.Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", 8765))
MAX_RFP_CHARS = 60_000


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, body: bytes, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._send(200, (HERE / "static" / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif re.fullmatch(r"/[a-z0-9-]+\.js", self.path) and (HERE / "static" / self.path[1:]).is_file():
            self._send(200, (HERE / "static" / self.path[1:]).read_bytes(), "text/javascript; charset=utf-8")
        elif self.path == "/api/sample":
            self._send(200, (HERE / "samples" / "rfp-santa.md").read_bytes(), "text/plain; charset=utf-8")
        elif self.path == "/api/roster":
            self._send(200, json.dumps(roster(), ensure_ascii=False).encode(), "application/json")
        else:
            self._send(404, b"not found", "text/plain")

    def do_POST(self):
        if self.path != "/api/run":
            return self._send(404, b"not found", "text/plain")
        length = int(self.headers.get("Content-Length") or 0)
        try:
            rfp = (json.loads(self.rfile.read(length) or b"{}").get("rfp") or "").strip()[:MAX_RFP_CHARS]
        except (ValueError, AttributeError):
            return self._send(400, b"invalid json", "text/plain")
        if not rfp:
            return self._send(400, b"empty rfp", "text/plain")

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        events = queue.Queue()

        def work():
            try:
                run_swarm(rfp, events.put)
            except Exception as exc:
                events.put({"type": "fatal", "error": f"{type(exc).__name__}: {exc}"[:300]})
            finally:
                events.put(None)

        threading.Thread(target=work, daemon=True).start()
        while (event := events.get()) is not None:
            try:
                self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                break  # browser left; the swarm finishes in the background

    def log_message(self, fmt, *args):
        pass  # keep the console quiet


if __name__ == "__main__":
    print(f"Wichtel RFP desk: http://127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
