import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("memory", Path(__file__).parents[1]/"custom_components/luna_local/memory.py")
memory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(memory)


class MemoryTests(unittest.TestCase):
    def test_questions_and_commands_are_not_memories(self):
        for text in ["Wie heißt der temporäre Einrichtungstest?", "Luna, schalte das Licht aus", "Was weißt du über mich", "Mag ich Kaffee?"]:
            self.assertFalse(memory.should_extract(text))
        self.assertTrue(memory.should_extract("Ich trinke Kaffee ohne Zucker."))

    def test_personal_declarations_are_preserved_but_questions_are_not(self):
        for text in ["Ich trinke Kaffee ohne Zucker.", "Meine Lieblingsfarbe ist Blau.", "Ich heiße Daniel."]:
            self.assertTrue(memory.explicit_personal_fact(text))
        for text in ["Was ist meine Lieblingsfarbe?", "Ich trinke Kaffee?", "Hallo Luna", "Schalte mein Licht aus"]:
            self.assertFalse(memory.explicit_personal_fact(text))

    def test_restart_recall_and_permanent_deletion(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/"memory.db"
            store = memory.MemoryStore(path)
            store.initialize()
            mid = store.add("Der Testcode lautet Eisvogel-731.", "Test", True)
            store.add("Ein unbekannter Sprecher mag Tee.", "Wohnzimmer")
            store = memory.MemoryStore(path)
            store.initialize()
            self.assertEqual(store.count(), 2)
            self.assertEqual(store.recall("Wie lautet der Testcode?", 1)[0]["id"], mid)
            self.assertEqual(store.forget(mid), 1)
            self.assertEqual(memory.MemoryStore(path).count(), 1)
            self.assertEqual(store.forget(mid), 0)

    def test_source_attribution_deduplication_and_sql_safety(self):
        with tempfile.TemporaryDirectory() as folder:
            store = memory.MemoryStore(Path(folder)/"memory.db")
            store.initialize()
            text = "Ich mag 'Tee'; DROP TABLE memories; --"
            mid = store.add(text, "Unbekannt, Wohnzimmer")
            self.assertEqual(store.add(text, "Unbekannt, Wohnzimmer"), mid)
            store.add(text, "Unbekannt, Schlafzimmer")
            self.assertEqual(store.count(), 2)
            self.assertEqual(store.forget("' OR 1=1 --"), 0)


if __name__ == "__main__":
    unittest.main()
