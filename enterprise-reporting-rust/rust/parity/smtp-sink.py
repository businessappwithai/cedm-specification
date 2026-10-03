"""A local SMTP server that keeps every message it receives as JSON, for
parity/email-batch.ts: `python3 smtp-sink.py <port> <dir>`. Python 3.11's
smtpd (removed in 3.12); no TLS, no auth."""
import asyncore, base64, email, email.policy, json, os, smtpd, sys, uuid

port, out = int(sys.argv[1]), sys.argv[2]
os.makedirs(out, exist_ok=True)


class Sink(smtpd.SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data, **kw):
        msg = email.message_from_bytes(data, policy=email.policy.default)
        html, files = None, []
        for part in msg.walk():
            if part.is_multipart():
                continue
            name = part.get_filename()
            if name:
                files.append({
                    "filename": name,
                    "contentType": part.get_content_type(),
                    "data": base64.b64encode(part.get_payload(decode=True)).decode(),
                })
            elif part.get_content_type() == "text/html":
                html = part.get_content()
        with open(os.path.join(out, f"{uuid.uuid4()}.json"), "w") as f:
            json.dump({"to": rcpttos, "subject": str(msg["subject"]), "html": html, "attachments": files}, f)


Sink(("127.0.0.1", port), None, decode_data=False)
asyncore.loop()
