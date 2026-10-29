# Native Arm-Reparatur — 29.10.2026

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

## Arbeitskopie und aktueller Halt

`/home/dreimer/shares/music/Luna/native-arm-repair-20261029/`
enthält eine unveränderte Kopie der V9-CMO3 als
`luna-native-arm-working.cmo3` und Vergleichsbilder. Noch keine native
Gelenkkorrektur gespeichert. Originale, HA-Modell und Wintervorschau unverändert.

Beim ersten Tastaturzugriff zeigte KDE den Systemdialog
„Fernsteuerung – python möchte Eingabegeräte steuern“. Die Bestätigung dieses
Betriebssystemdialogs wurde beim Nutzer angefordert. Kein Umgehen der Freigabe.
Danach Arbeitskopie im Editor öffnen, originale B-Grundhaltung samt Gelenkkette
vergleichen und erst einen Arm mit echten Modell-Keyforms reparieren.

Lokaler Vergleich (privates V9-Modell und SDK erforderlich):

```sh
node tools/live2d/build.mjs /pfad/zum/CubismSdkForWeb-5-r.5 --mao-sample
node tools/live2d/native-arm-server.mjs
# http://127.0.0.1:8792/tests/native-arm-study.html
```

Mao © Live2D Inc.; private Originale und abgeleitete CMO3 bleiben außerhalb Git.
[Rotation-Deformer-Dokumentation](https://docs.live2d.com/en/cubism-editor-manual/making-and-rotation-of-rotationdeformer/).
