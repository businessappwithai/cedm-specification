"""A deterministic stand-in for every model endpoint the backends call:
llama.cpp's OpenAI-compatible API (chat completions, transcription, speech)
and the Mastra server's HTTP API (health, NL→SQL, monitoring pipeline).

It records every request it receives, so a parity script can compare not
only what each backend answers but what it *sent*: the prompts, byte for byte.

    python3 rust/parity/llm-stub.py 4199

    GET  /__log    the recorded requests since the last reset
    POST /__reset  clear the log

Answers depend only on the request, never on order or time. A question
containing "broken" gets SQL that fails once (the retry path); one
containing "vague" is classified as ambiguous.
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LOG = []


def completion(content):
    return {
        "id": "stub",
        "object": "chat.completion",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
    }


def chat(body):
    messages = body.get("messages", [])
    system = next((m["content"] for m in messages if m.get("role") == "system"), "")
    user = next((m["content"] for m in messages if m.get("role") == "user"), "")
    if "intent classification specialist" in system:
        if "vague" in user:
            return completion('{"intent_type": "ambiguous", "confidence": 0.2}')
        return completion(
            json.dumps(
                {
                    "intent_type": "monitoring_rule",
                    "confidence": 0.91,
                    "metric": "total_amount",
                    "data_hint": "orders amount",
                    "schedule_natural": "every Monday",
                    "schedule_cron": "0 8 * * 1",
                    "threshold_operator": "lt",
                    "threshold_value": 100,
                    "alert_channels": ["email", "in_app"],
                }
            )
        )
    if "SQL generation specialist" in system:
        if "broken" in user and "PREVIOUS SQL FAILED" not in user:
            sql = "SELECT nope FROM orders"
        elif "salar" in user:
            sql = "SELECT name, salary FROM hr_salaries"
        else:
            sql = "SELECT customer, SUM(amount) AS total FROM orders GROUP BY customer ORDER BY customer"
        return completion(
            "Here you go:\n```json\n"
            + json.dumps({"sql": sql, "metric_column": "total", "explanation": "stub", "confidence": 0.9, "warnings": []})
            + "\n```"
        )
    if "Fix SQL query errors" in system:
        return completion("SELECT id, customer FROM orders ORDER BY id")
    if "expert SQL query generator" in system:
        if "salar" in user:
            return completion("```sql\nSELECT name, salary FROM hr_salaries\n```")
        return completion("```sql\nSELECT id, customer, amount FROM orders ORDER BY id\n```")
    return completion("{}")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send(self, status, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/__log":
            return self.send(200, LOG)
        if self.path.endswith("/health"):
            return self.send(200, {"status": "ok"})
        return self.send(404, {"error": "not found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length)
        ctype = self.headers.get("Content-Type", "")
        if self.path == "/__reset":
            LOG.clear()
            return self.send(200, {"ok": True})
        if "json" in ctype:
            try:
                body = json.loads(raw or b"{}")
            except ValueError:
                body = {"_unparsed": raw.decode(errors="replace")}
        else:
            # Multipart: record the field names and sizes, not the bytes.
            body = {"_multipart_bytes": len(raw), "_has_wav": b"RIFF" in raw}
        LOG.append({"path": self.path, "auth": self.headers.get("Authorization"), "body": body})
        if self.path.endswith("/chat/completions"):
            return self.send(200, chat(body))
        if self.path == "/api/nl-to-sql":
            question = body.get("nlQuestion", "")
            sql = "SELECT name, salary FROM hr_salaries" if "salar" in question else "SELECT id, customer, amount FROM orders ORDER BY id"
            return self.send(200, {"sql": sql, "explanation": "stub translation", "confidence": 0.88, "warnings": []})
        if self.path == "/api/build-monitoring-pipeline":
            request = body.get("nlRequest", "")
            if "unreachable" in request:
                return self.send(503, {"error": "down"})
            return self.send(
                200,
                {
                    "success": True,
                    "intent": {"intent_type": "monitoring_rule", "confidence": 0.9, "metric": "total_amount"},
                    "reportDefinition": {
                        "sql": "SELECT SUM(amount) AS total_amount FROM orders",
                        "metric_column": "total_amount",
                        "explanation": "stub supervisor",
                        "confidence": 0.9,
                        "warnings": [],
                    },
                    "monitoringRule": {
                        "name": "Order total alert",
                        "description": request,
                        "threshold_operator": "lt",
                        "threshold_value": 100,
                        "escalation_threshold_pct": 20,
                        "alert_channels": ["email", "in_app"],
                        "notify_on_pass": False,
                        "notify_on_no_data": True,
                    },
                    "schedule": {"cron_expression": "0 8 * * 1", "timezone": "UTC", "description": "Every Monday at 08:00 UTC"},
                },
            )
        if self.path.endswith("/audio/transcriptions"):
            return self.send(200, {"text": "  total orders by customer  "})
        if self.path.endswith("/audio/speech"):
            return self.send(200, b"RIFF\x00\x00\x00\x00WAVEstub-audio", "audio/wav")
        return self.send(404, {"error": "not found"})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4199
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
