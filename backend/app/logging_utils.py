import json
import time
from datetime import datetime
from pathlib import Path
from uuid import uuid4

LOG_FILE_PATH = Path(__file__).resolve().parent.parent / "logs" / "rag_trace.jsonl"


class RequestLogger:
    """Lightweight request tracing - outputs JSON logs to stdout and a JSONL file"""

    def __init__(self):
        self.trace_id = str(uuid4())
        self.start_time = time.time()

    def log(self, event_type: str, **data):
        elapsed_ms = round((time.time() - self.start_time) * 1000, 2)
        entry = {
            "timestamp": datetime.now().isoformat(),
            "trace_id": self.trace_id,
            "event": event_type,
            "elapsed_ms": elapsed_ms,
            **data,
        }
        line = json.dumps(entry)
        print(line)

        try:
            LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(LOG_FILE_PATH, "a") as f:
                f.write(line + "\n")
        except OSError:
            pass
