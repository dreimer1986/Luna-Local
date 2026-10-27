"""Malformed exports must fail before copying them to Home Assistant."""
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest

script = Path(__file__).parents[1] / "tools/validate_live2d_model.py"
spec = importlib.util.spec_from_file_location("live2d_preflight", script)
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)


class Live2DModelTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        contract = preflight.read_json(preflight.CONTRACT)
        self.write("luna.cdi3.json", {"Parameters": [{"Id": p} for p in contract["required_parameters"]]})
        # Structural fixtures only: these deliberately are NOT renderable models.
        (self.root / "luna.moc3").write_bytes(b"MOC3" + bytes(64))
        (self.root / "texture.png").write_bytes(b"\x89PNG\r\n\x1a\n" + struct.pack(">I", 13) + b"IHDR" + struct.pack(">II", 1024, 1024))
        self.write("luna.physics3.json", {"Version": 3})
        self.write("luna.motionsync3.json", {"Version": 3})
        self.write("idle.motion3.json", {"Version": 3, "Curves": [{"Id": "ParamAngleX"}]})
        self.write("neutral.exp3.json", {"Type": "Live2D Expression", "Parameters": []})
        self.refs = {
            "Moc": "luna.moc3", "Textures": ["texture.png"], "Physics": "luna.physics3.json",
            "MotionSync": "luna.motionsync3.json", "DisplayInfo": "luna.cdi3.json",
            "Expressions": [{"Name": n, "File": "neutral.exp3.json"} for n in contract["required_expressions"]],
            "Motions": {n: [{"File": "idle.motion3.json"}] for n in contract["required_motion_groups"]},
        }

    def write(self, name, data):
        (self.root / name).write_text(json.dumps(data), encoding="utf-8")

    def check(self):
        self.write("luna.model3.json", {"Version": 3, "FileReferences": self.refs})
        return preflight.validate(self.root / "luna.model3.json")

    def test_preflight_does_not_claim_visual_or_core_validation(self):
        self.assertIn("still required", self.check()["result"])

    def test_missing_file(self):
        (self.root / "texture.png").unlink()
        with self.assertRaisesRegex(ValueError, "Missing"):
            self.check()

    def test_external_and_escaped_references(self):
        for name in ["https://example.com/x.png", "../x.png", "%2e%2e/x.png", "/x.png", "C:/x.png", "x.png?token=test", "..\\x.png"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                preflight.local_asset(self.root, name)

    def test_missing_emotion(self):
        self.refs["Expressions"] = [e for e in self.refs["Expressions"] if e["Name"] != "angry"]
        with self.assertRaisesRegex(ValueError, "angry"):
            self.check()

    def test_png_is_not_a_model(self):
        (self.root / "luna.moc3").write_bytes(b"\x89PNG\r\n\x1a\n")
        with self.assertRaisesRegex(ValueError, "MOC3 header"):
            self.check()

    def test_bad_parameter(self):
        self.write("neutral.exp3.json", {"Type": "Live2D Expression", "Parameters": [{"Id": "ParamAngleX", "Value": float("nan")}]})
        with self.assertRaisesRegex(ValueError, "Non-finite"):
            self.check()

    def test_no_secondary_audio_source(self):
        self.refs["Motions"]["Speaking"][0]["Sound"] = "speech.wav"
        with self.assertRaisesRegex(ValueError, "Sound"):
            self.check()


if __name__ == "__main__":
    unittest.main()
