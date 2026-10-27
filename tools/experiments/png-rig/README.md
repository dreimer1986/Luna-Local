# Archiv: PNG-Verformungsversuch

Dieser Versuch entstand vor der Entscheidung für Live2D. Er wird nicht von der
HA-Karte importiert und liegt bewusst außerhalb der Integration.

`preview.html` über einen HTTP-Server vom Repository-Hauptordner öffnen, z. B.
`python -m http.server 8000` und dann
`http://localhost:8000/tools/experiments/png-rig/preview.html`.

Die ursprünglichen drei Texturen und der Zwischenbild-Screenshot sind erhalten.
`luna-waist.png` ist eine unveränderte Kopie der freigegebenen Vorlage. Die anderen
beiden Dateien entstanden mit dem eingebauten ImageGen-Werkzeug; Prompts liegen
daneben. Hauptproblem: Doppelkonturen beim teilweise geschlossenen Auge.
Lachen/Ärger in dieser Testseite sind noch **nicht** implementiert und zeigen
Fallback-Posen. Der WebGL-Test bestand technisch; das ist keine optische Abnahme.

Nicht als fertige Luna-Animation ausliefern. Die neuen Live2D-Dateien befinden sich
in `tools/live2d` und `docs/live2d`.
