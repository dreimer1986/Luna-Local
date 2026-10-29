# Native Arm-Reparatur — 29.10.2026

## Neue native Formkorrektur und Vorschau

Live: https://ha.dreimer.de/local/luna/native-wave-20261029.html

Private Quelle: `native-arm-repair-20261029/luna-native-wave-forms.cmo3`,
Export daneben in `native-wave-export/`. Das ist eine neue bearbeitbare CMO3
und ein neuer MOC3-Export, keine Runtime-Verformung der Armvertices.

- Schulteransatz von ArtMesh0 verbreitert; unteres Oberarmende verkürzt.
- Überstehende Kappe von ArtMesh1 für die gehobene Haltung verkürzt und gerundet.
  Unterarm in dieser Haltung vor den Oberarm gelegt (Draw Order 560 statt 540).
- `ParamLunaArmRaise` (0..1, Standard 0) an die drei vorhandenen Rotationen
  und drei ArtMeshes der linken B-Arm-Kette gebunden. 0 enthält die kopierten
  Original-V9-Formen, 1 die korrigierte gehobene Haltung. Keine pauschale
  Neutralform-Kopie über die alten Schulter-/Ellbogenkombinationen.
- Handgelenk-Pivot Rotation20 bei gehobenem Arm an die Manschette gesetzt.
  Bei `ParamArmLB03` -30/0/10 liegen die korrigierten Winkel bei 0/15/30 Grad;
  Handform und Pivot an diesen drei Stellen abgeglichen.

Die Vorschau hebt den Arm in 1,5 Sekunden, winkt vier Sekunden aus dem
Handgelenk und senkt ihn in 1,5 Sekunden. Handgelenkbewegung ausschließlich
bei ArmRaise=1, ansonsten Wrist=0. Alte Schulter-, Ellbogen- und Handform-
Parameter bleiben auf ihren Standardwerten. Diese Einschränkung ist wichtig:
Kombinationen mit den übrigen alten Armparametern sind noch nicht repariert.
Andere Armseite, neue Fingerzeichnungen und weitere Posen sind ebenfalls offen.

Editorprüfung: Ruhehaltung, 25/50/75/100 Prozent Armhebung und beide seitlichen
Handstellungen. Browserprüfung über lokale und HA-URL: Arm 27630, Hand 1893,
Mund 228, Blinzeln 1013 geänderte Pixel, Rückkehr zur Ruhehaltung 0 Pixel
Abweichung; 71 Samples der Sequenz bleiben sichtbar. Das prüft Rendering und
Rückkehr, keine automatische anatomische Qualitätsbewertung. Stoffnähte und
Handform sind weiter sichtbar; der normale HA-Avatar bleibt unverändert.
Vergleich der neuen Ruhehaltung mit dem alten V9-Export: 73 abweichende Pixel
bei 720×1000 und Differenzschwelle 12 (also nicht identischer Export). Handyansicht
390×844 ohne horizontalen Überlauf; der echte Sieben-Sekunden-Ablauf endet mit
ArmRaise=0 und Wrist=0. Privates vollständiges Vorschaupaket:
`/home/dreimer/shares/music/Luna/Luna-Native-Winken-2026-10-29.zip`, einschließlich
CMO3, Export, Runtime, lokaler Vorschauseite, Bildern und SHA256SUMS.

Reproduktion: Export nach `tools/live2d/dist/LunaNativeWave/` kopieren,
Diagnoseserver unten starten, dann `node tools/live2d/native-wave-smoke.mjs`.
Optional `LUNA_WAVE_TEST_URL` auf die Vorschau-URL mit `?manual` setzen.
Quelle der Vorschauseite: `tests/native-wave-study.html`.

Bearbeitungshinweise: Unter Wine schlug ein direkter Vertex-Drag fehl; Undo
und gezielte Pfeiltasten-Verschiebungen funktionierten. Shift+Pfeil bewegt hier
um fünf Bildschirm-Pixel. Ctrl-Ziehen eines Rotationspivots funktionierte.
Copy Form benutzt die Systemzwischenablage: anschließendes Text-Kopieren
verwirft die kopierten Formen. Beim Übertragen zwischen Kopien desselben Modells
passt der Editor die sechs Quell-/Zielobjekte anhand ihrer Identität zu.

Die folgenden Abschnitte dokumentieren die Diagnose vor der Formkorrektur.

Nutzervorgabe: Gelenke und Bewegungsaufbau aus dem fertigen Mao-Modell übernehmen.
Die Winter-Runtime-Studie und ihre räumliche Verformung erfüllen diese Vorgabe
nicht. Nicht weiter als fertigen Bewegungsaufbau ausbauen oder ausrollen.

## Isolierter Vergleich

`tests/native-arm-study.html` lädt das unveränderte SDK-Mao und Luna V9
nebeneinander. `nativeRig:true` deaktiviert die zusätzlichen Runtime-
Arm-/Körper-/Gesichtsverformungen sowie die überschreibenden Arm-Idle-Parameter.
Geprüft werden unmittelbar die im MOC3 enthaltenen Formen. Die optionale
`partOpacities`-Angabe aktiviert ausdrücklich Maos B-Arm (`PartArmLB`) und
blendet A aus. Andernfalls zeigt die Vorlage standardmäßig den A-Arm und ein
Vergleich der B-Parameter wäre irreführend.

Parameterbereiche bei beiden Modellen:

| Parameter | Minimum | Maximum |
|---|---:|---:|
| ParamArmLB01 — Schulter | -30 | 30 |
| ParamArmLB02 — Ellbogen | -30 | 30 |
| ParamArmLB03 — Handgelenk | -30 | 10 |
| ParamHandLB — Handform | -10 | 10 |

Befund: Bei Schulter/Ellbogen jeweils +30 ist Maos B-Arm angewinkelt und die Hand
neben dem Kopf. Lunas übertragener B-Arm hängt bei denselben Werten weiterhin
nach unten/seitlich. Die übernommenen Parameterbereiche allein liefern also
keine entsprechende Winke-Grundhaltung. Es liegt ein Unterschied in der
übertragenen Grundgeometrie/den Keyforms vor, kein fehlender Browser-Parameter.

Historisch wurden die Armketten zur Korrektur wandernder Pivots an allen
Schulter-/Ellbogenkombinationen auf neutrale Geometrie abgeglichen (V6). Dadurch
ist die ursprüngliche Formgebung der Vorlage nicht vollständig erhalten.
Vor einer neuen Übernahme Grundhaltung und alle drei Drehpunkte in den
bearbeitbaren Quellen vergleichen. Keine erneute pauschale Neutralform-Kopie.

## Arbeitskopie und aktueller Stand

`/home/dreimer/shares/music/Luna/native-arm-repair-20261029/`
enthält eine unveränderte Kopie der V9-CMO3 als
`luna-native-arm-working.cmo3` und Vergleichsbilder. Original-Arbeitskopie,
HA-Modell und Wintervorschau unverändert.

Beim ersten Tastaturzugriff zeigte KDE den Systemdialog
„Fernsteuerung – python möchte Eingabegeräte steuern“. Die Bestätigung dieses
Betriebssystemdialogs wurde beim Nutzer angefordert. Kein Umgehen der Freigabe.
Freigabe inzwischen erteilt, Editorzugriff funktioniert.

### Nativer Pivot-Versuch (kein Release)

Separat gesichert: `luna-native-elbow-pivot-study-NOT-RELEASE.cmo3` im selben
privaten Verzeichnis. Bei neutralen Parameterwerten wurde Rotation19
(`Forearm L B Rotation`) per Ctrl-Ziehen um 29 Bildschirm-Pixel nach links und
10 nach oben versetzt (Canvas-Zoom 56,8 %). Angezeigte Vertices Info danach:
X 689.144, Y 563.066. Anschließend Winkel -115 auf -235 Grad, Schulter
Rotation18 von 100 auf 65 Grad gesetzt. Das sind Inspector-Winkel, keine
Parameterwerte! Geändert ist nur die aktuell bearbeitete Form, keine vollständig
korrigierte Parameterkombinationsmatrix oder fertige Winke-Animation.

Ergebnis: Die große Ellbogenlücke schließt sich in dieser Testhaltung. Es bleiben
eine doppelte Ärmelkontur am Ellbogen und eine offene Schulternaht. Die nativen
Drehungen allein reichen mit den vorhandenen übertragenen Formen nicht für ein
sauberes Winken. Nächster notwendiger Schritt: passende Formkorrekturen an
Ärmel/Schulter für die gehobene B-Pose und konsistente Keyforms, danach Prüfung
des gesamten Bewegungsverlaufs. Nicht die Diagnosepose als fertigen Rig ausrollen.

Belege im privaten Ordner: `luna-elbow-neutral.png`, `luna-pivot-test.png`,
`luna-pivot-shoulder-test.png`. Cubism verweigerte Speichern auf Z: mit einer
Zugriffsfehlermeldung, auch in einem lokalen Linux-Verzeichnis. Speichern unter
`C:\LunaNative\elbow-study.cmo3` gelang; anschließend nach Linux/NAS kopiert.
Keine unbenutzten Quellbilder gelöscht. Im Dialog mit der Frage nach dem Löschen
Tab von Yes auf No, dann Leertaste verwenden; Alt+N war nicht zuverlässig.

Lokaler Vergleich (privates V9-Modell und SDK erforderlich):

```sh
node tools/live2d/build.mjs /pfad/zum/CubismSdkForWeb-5-r.5 --mao-sample
node tools/live2d/native-arm-server.mjs
# http://127.0.0.1:8792/tests/native-arm-study.html
```

Mao © Live2D Inc.; private Originale und abgeleitete CMO3 bleiben außerhalb Git.
[Rotation-Deformer-Dokumentation](https://docs.live2d.com/en/cubism-editor-manual/making-and-rotation-of-rotationdeformer/).
