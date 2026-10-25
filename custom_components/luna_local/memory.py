"""Small local, source-backed memory store. Call from an executor thread."""
import json
import re
import sqlite3
import uuid
from datetime import datetime, timezone


def words(text):
    stop = {"ich", "du", "der", "die", "das", "und", "ist", "ein", "eine", "mir", "mich", "was", "über", "bitte", "luna", "dir", "den", "dem", "von", "mit", "hat", "habe", "meine", "mein"}
    return {w for w in re.findall(r"[\wäöüß]+", text.casefold()) if len(w) > 2 and w not in stop}


def should_extract(text):
    """Do not turn questions or household commands into asserted memories."""
    text = re.sub(r"^(?:hey\s+)?(?:luna|jarvis)[,!: ]*", "", text.strip(), flags=re.IGNORECASE)
    if "?" in text:
        return False
    return not bool(re.match(
        r"^(wer|wie|wo|wann|warum|wieso|weshalb|welche\w*|was|kannst|könntest|würdest|hast|ist|sind|gibt|schalte|schalt|mach|stelle|stell|öffne|schließe|stopp|stop|vergiss|merke|merk)\b",
        text, re.IGNORECASE,
    ))


def explicit_personal_fact(text):
    """Recognize common explicit declarations without a model deciding to discard them."""
    if not should_extract(text):
        return False
    return bool(re.search(
        r"\b(ich\s+(mag|liebe|bevorzuge|trinke|esse|heiße|heisse|wohne|arbeite)|mein(?:e|en|er)?\s+(name|geburtstag|lieblings\w*|adresse))\b",
        text, re.IGNORECASE,
    ))


class MemoryStore:
    def __init__(self, path):
        self.path = str(path)

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    def initialize(self):
        with self.connect() as db:
            # DELETE journal lets ordinary Home Assistant backups include a complete DB.
            db.execute("PRAGMA journal_mode=DELETE")
            db.execute("CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, fact TEXT NOT NULL, source TEXT NOT NULL, created TEXT NOT NULL, explicit INTEGER NOT NULL)")

    def add(self, fact, source, explicit=False):
        fact = fact.strip()
        if not fact or len(fact) > 2000:
            raise ValueError("Erinnerung muss 1 bis 2000 Zeichen enthalten")
        with self.connect() as db:
            old = db.execute("SELECT id FROM memories WHERE fact=? AND source=?", (fact, source)).fetchone()
            if old:
                return old["id"]
            if db.execute("SELECT COUNT(*) FROM memories").fetchone()[0] >= 5000:
                raise ValueError("Gedächtnislimit erreicht; Erinnerungen prüfen und löschen")
            mid = uuid.uuid4().hex[:12]
            db.execute("INSERT INTO memories VALUES (?,?,?,?,?)", (mid, fact, source, datetime.now(timezone.utc).isoformat(), int(explicit)))
            return mid

    def recall(self, query="", limit=20):
        with self.connect() as db:
            rows = [dict(r) for r in db.execute("SELECT * FROM memories ORDER BY created DESC")]
        terms = words(query)
        if terms:
            rows.sort(key=lambda r: len(terms & words(r["fact"])) * 10 + int(r["explicit"]), reverse=True)
        return rows[:limit]

    def forget(self, memory_id):
        with self.connect() as db:
            return db.execute("DELETE FROM memories WHERE id=?", (memory_id,)).rowcount

    def count(self):
        with self.connect() as db:
            return db.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
