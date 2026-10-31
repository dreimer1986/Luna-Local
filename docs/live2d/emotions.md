# Emoji-Mimik im nativen Avatar (31.10.2026)

Emoji-Erkennung allein stellte die Mimik im nativen Modell nicht dar. Die
synthetischen Joy/Laugh/Shy/Surprise-Steuerwerte werden jetzt im nativen Adapter
auf vorhandene Mund- und Augenformen abgebildet. Keine neuen Meshes, keine
Vertexverformung, keine Änderungen am Modell oder an den freigegebenen Texturen.

- 😄: leicht geöffneter lächelnder Mund, etwas entspanntere Lider.
- 😂: nahezu geschlossene Augen und geöffneter lächelnder Mund.
- 😊: vorhandene Wangenröte plus leicht gesenkte Lider.
- 😮: offene Augen und geöffneter Mund. Das ist eine Annäherung; eine eigene
  runde O-Mundform oder angehobene Brauen sind damit nicht neu modelliert.
- 👋: weiterhin nativer Winkarm, nun mit zugeordneter Freude.

Die bisherige Emoji-Tabelle gilt weiter: z.B. 😅 zählt zu verlegen. Pro Antwort
wird ein Ausdruck mit fester Priorität gewählt, keine zeitliche Emoji-Abfolge.
Ohne Marker benutzt der lokale Agent optional die vorhandene Klassifikation;
Gemini startet keine versteckte Ollama-Anfrage. Raumantworten nutzen ihre Marker.

Mundform bleibt auf ±0,35 begrenzt. Kopf-/Brauen-/Blicksperren bleiben erhalten.
Beim Sprechen hat die Audio-Mundöffnung einschließlich Nullwert in Pausen
Vorrang (`ParamLunaSpeaking`). Ohne Audio darf der Ausdruck den Mund leicht
öffnen. Blinzeln schließt weiterhin vollständig; neutral setzt den Ausdruck
zurück. Reduced Motion unterdrückt Körpergestik, nicht die statische Mimik.

Nicht umgesetzt: vollständiges saures Gesicht, neue traurige/denkenden Formen,
Hüftposen, verschränkte Arme, Emotionssteuerung des Schwanzes, neue Kleidung.
Die vorhandenen Smile-/Brauenparameter lieferten im geprüften Modell keine
brauchbare zusätzliche Form und werden nicht als neue Mimik ausgegeben.

## Prüfen und verwenden

HA-Testseite: `/local/luna/emotions-20261031.html`. Emoji-Tasten, freie Antwort,
stummer Sprechmundtest und Wechsel zwischen Gesicht und Ganzkörper. Keine
KI-Anfrage, kein Mikrofon. Verwendet den echten Parser und Performance-Treiber.

Lokal: `tests/luna-emotions.html`, `node tools/live2d/emotion-check.mjs`.
Live: `LUNA_EMOTION_URL=https://ha.dreimer.de/local/luna/emotions-20261031.html node tools/live2d/emotion-check.mjs`.
Unit-Tests: `node --test tests/test_native_avatar.mjs tests/test_performance.mjs tests/test_emotion_markers.mjs`.
Screenshots liegen privat unter tools/live2d/dist/emotion-*.png. Die Ausdrücke
wurden in Nahansicht geprüft. Der Browsertest prüft sichtbare Änderungen,
Rückkehr zu neutral und fehlerfreies Laden; er ersetzt keine ästhetische Abnahme.

Hauptdashboard und Vollbild verwenden `runtime-emotions-20261031/runtime.mjs`,
weiterhin das unveränderte Modell `model-native-tail-20261030`. Frontend-Import-
und Ressourcenkennungen wurden aktualisiert. Geöffnete HA-Seiten neu laden.
Sicherung der vorherigen Frontend-Dateien und Dashboard-Konfigurationen privat
unter `/home/dreimer/shares/music/Luna/emotions-20261031/backup/`.
