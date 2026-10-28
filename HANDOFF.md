# Luna zu Hause fortsetzen — Übergabe 27.10.2026

## Aktueller Transportstand: 28.10.2026, nach manueller Schulterkorrektur

Dieser Abschnitt ersetzt die älteren Angaben zum neuesten Modell/Paket unten.
Alles für die lokale Mao-Studie steckt jetzt in
`Downloads/Luna-Komplett-2026-10-28.zip`; die beiden älteren Teil-ZIPs sind
dafür nicht zusätzlich nötig. Das Paket enthält ein Git-Bundle des Arbeitsbranches,
alle Mao-test-Arbeitsordner einschließlich Original und Vorlage, das Web-SDK,
den lokalen Browser-Test-Build und eine separate V5-Autosicherung. Keine Konten,
Passwörter oder Editor-Lizenzaktivierung werden übertragen. Cubism muss auf dem
Zielrechner installiert/aktiviert sein. Das bestehende HA-Portraitprojekt liegt
weiterhin auf dem Heimrechner und ist nicht Bestandteil dieser lokalen Sicherung.

Neueste Körperdatei im Paket:
`Cubism/Mao-test/luna-body-v4/luna-mao-body-v5.cmo3`.
Der Nutzer verschob `Upper Arm L B Rotation` (`Rotation18`) per Strg+Ziehen
zum Schulteransatz. In der Neutralpose sitzt der Punkt nun plausibel. Beim Test
von `Arm L B_Shoulder` bei -30/+30 sprang er jedoch wieder nach unten; Oberarm
und Unterarm lösten sich deutlich voneinander. Die Änderung ist noch nicht
konsistent in den End-Keyforms. `Arm L B Position` ist dessen Eltern-Deformer;
sein tiefer Mittelpunkt allein beweist keinen Fehler. Nicht blind ebenfalls
verschieben. Gegenüberliegende Schulter ist noch nicht korrigiert.

Nächster Versuch: auf einer Kopie die korrigierte Neutralposition mittels
"Options for Paste Form Special" / "Vertices info" auf die End-Keyforms
übertragen, dabei Winkel und Skalierung erhalten und die Auswirkungen auf
Kind-Deformer prüfen. Das ist nur ein recherchierter Ansatz, noch NICHT getestet.
Die zuletzt untersuchte Neutralnähe war -0,3 statt exakt 0: vor Kopieren exakt
auf Standardwerte zurückstellen. Neutral-, End- und Zwischenposen visuell prüfen.

Beim abschließenden Verpacken war Cubism bereits geschlossen. Die gespeicherte
V5-Datei wurde auf Platte gefunden (1.744.071 Bytes, Änderungszeit 16:25:05).
Sie konnte nach dem Schließen nicht erneut im Editor geprüft werden; das Paket
bewahrt zusätzlich die Autosicherung von 12:28:44 separat. Keine neue
Schulterkorrektur durch den Assistenten, kein Runtime-Export, keine HA-Änderung.

### Auf dem Heimrechner

ZIP entpacken und `START-HIER.md` lesen. Vorhandenen Checkout auf
`work/luna-live2d-preparation` aktualisieren. Alternativ offline klonen:

```sh
git clone --branch work/luna-live2d-preparation Luna-Local.bundle Luna-Local
```

Das SDK liegt unter `Cubism/CubismSdkForWeb-5-r.5`. Den optionalen Browser-Build
aus `private-browser-dist` bei Bedarf nach `Luna-Local/tools/live2d/dist` kopieren.
Die exportierte Mao-Vorlage liegt unter `Cubism/Mao-test/template`.
Material- und Rig-Grenzen in den folgenden Abschnitten bleiben gültig.

**Nachtrag 28.10.:** Nutzer möchte Mao als Rig-Vorlage testen und Luna künftig
ganzkörperlich einschließlich Beinen/Füßen vorbereiten. Der lokale Browser-Test
ist unter [Mao-Studie](docs/live2d/mao-study.md) dokumentiert. Mao-Quelldatei liegt
privat vor. Editorzugriff und PRO Trial sind inzwischen bestätigt, eine portable
Mao-Modellvorlage wurde exportiert; erste Körperübertragungen sind jetzt als
private CMO3 gespeichert. HA bleibt auf dem unten dokumentierten Portraitmodell.

**Weiterer Stand 28.10.:** Desktopzugriff wiederhergestellt. Der korrigierte
Wadentest ist in `Downloads/Cubism/Mao-test/luna-body-v2/luna-mao-calf-test.cmo3`
gespeichert. Die neueste Körperstudie liegt in
`Downloads/Cubism/Mao-test/luna-body-v4/luna-mao-body-v4.cmo3`.
Sie enthält elf übertragene Körperteile und eine gesperrte, ungeriggte Kopfreferenz.
`tools/separate_luna_body.py --mao-body --output NEUER_ORDNER` erzeugt zwölf
PSD-Ebenen mit ganzen Beinen, anatomischen Mao-Namen und korrigierten
Ärmelkonturen. Neutrale Rekonstruktion und PSD-Roundtrip sind pixelgenau geprüft.
Die doppelte Vorlage `Forearm R` muss manuell auf die letzte Variante (Arm R B)
gesetzt werden; danach Enter und Mapping-OK. Automatik mischt sonst A und B.

**Kein fertiger Avatar:** Schulterdrehpunkte liegen noch zu tief; an den
Extremposen lösen sich Ärmel vom Schulteransatz. Ein kleiner Stoffrest und fehlende
Gelenküberlappungen bleiben. Kopf/Gesicht/Haare sind noch nicht übertragen.
Der ausgewählte linke Oberarm-Deformer zeigt den zu tiefen Drehpunkt direkt.
Die offizielle Drehpunktkorrektur erfordert Strg+Ziehen ohne Bewegung der Kinder;
die aktuelle `sky.drag`-API bietet keine Modifier-Tasten. Nicht durch normales
Ziehen ersetzen: Das verschiebt die Bildteile mit. Kein neuer Runtime-Export und
keine HA-Änderung. Details, Dateinamen und Fortsetzung in der Mao-Studie.

**Transportpaket:** `C:\Users\dreimer\Downloads\Luna-Mao-authoring-2026-10-28.zip`
(107.705.529 Bytes). Enthält V2/V3/V4 mit PSD/CMO3, die exportierte Mao-Vorlage,
Original-ReadMe, Arbeitsstand und SHA-256-Manifest. Alle 59 Nutzdateien wurden
direkt aus dem ZIP gegen das Manifest geprüft. Das Paket bleibt privat und muss
zum anderen Rechner mitgenommen werden; Git enthält nur eigenes Skript und Doku.

## Den richtigen Branch holen

**Gesichtsmaterial, weiterer Stand 28.10.:**
`Downloads/Cubism/Mao-test/luna-fullbody-face-v1` enthält die getrennten
Gesichtsebenen der Ganzkörperstudie. `luna-combined-v1` enthält eine gemeinsame
PSD mit 25 sichtbaren Ebenen sowie die in Cubism importierte, separat gespeicherte
`luna-fullbody-face-separated.cmo3` (noch ohne Rig). Sichtbare Quellpixel,
Transparenz und PSD-Roundtrip sind exakt geprüft. Die frühere Portraittrennung
wurde ebenfalls erfolgreich erneut geprüft. Die Hautreparatur ist sichtbar
unzureichend und bleibt ausgeblendet; in der kombinierten PSD fehlt sie bewusst.
Keine neue Mimik oder Runtime daraus ableiten. Details und reproduzierbare
Befehle stehen in `tools/live2d/README.md`. Der Schulterdrehpunkt bleibt offen.
Zusatzpaket: `Downloads/Luna-face-materials-2026-10-28.zip`, getrennt vom älteren
Mao-Transportpaket. Es enthält die neuen Gesichtsmaterialien und kombinierte Studie.

```sh
git clone --branch work/luna-live2d-preparation https://github.com/dreimer1986/Luna-Local.git
cd Luna-Local
```

Bei vorhandenem Checkout erst `git status` ansehen und eigene Änderungen sichern:

```sh
git fetch origin
git switch work/luna-live2d-preparation
git pull --ff-only
```

**Nicht nur `master` auschecken:** Die Live2D-Arbeit liegt auf diesem Arbeitsbranch.
Nach dem Weiterarbeiten committen/pushen, auf dem anderen PC wieder pullen.

## Ziel und verbindliche Gestaltung

Browser zuerst, Lovelace-Kachel und Popup gleichwertig. Browser-Mikrofon und
Lautsprecher verwenden dieselbe HA-Assist-Sitzung. Luna bis zur Hüfte; Gesicht,
Lachen, Ärger, Verlegenheit, natürliche Übergänge und passende Lippen haben Priorität.
Die freigegebene junge Anime-Ragdoll-Luna mit tiefblauen Augen und cremefarbenem
Pullover muss erkennbar bleiben. Kleidung ausnahmslos altersgerecht, vollständig
SFW und nicht sexualisiert. Später getrennte Outfits/Hintergründe, Frigate und
Roboterplattform. Letztere sind bisher Konzept.

## Was tatsächlich vorliegt

| Bestandteil | Datei / Stand |
|---|---|
| Freigegebenes Original | `docs/branding/luna-waist-reference.png` |
| Weitere Bildquellen/Prompts | `docs/branding/`, `docs/live2d/references/` |
| Cubism-Editor-Projekt | `docs/live2d/source/luna-reference-only.cmo3` |
| Pixelgenaue Gesichtszerlegung | `docs/live2d/source/original-separation/luna-face-separated.psd` |
| Importierte Originalebenen | `docs/live2d/source/luna-face-separated.cmo3` |
| Rig-/Ebenenvorgabe | `docs/live2d/rig-contract.json` |
| Modell-Dateiprüfung | `tools/validate_live2d_model.py` |
| Echter Cubism-Web-Adapter + Build | `tools/live2d/` |
| Browser-Testseite | `tests/live2d-preview.html` |
| Früherer PNG-Versuch, archiviert | `tools/experiments/png-rig/` |
| Aktuelle HA-Karte/Sprachsitzung | `custom_components/luna_local/frontend/` |

**Aktueller Stand 27.10.2026 abends:** Ein echtes Luna-MOC3 ist unter Wine in
Cubism FREE erstellt, im Browser geprüft und in der vorhandenen HA-Testkarte
aktiviert. Augen blinzeln, der Mund folgt der tatsächlichen TTS-Wiedergabe.
Der Nutzer hat das Blinzeln ausdrücklich gutgeheißen und den Sprechmund kritisiert;
dessen helle Lippenreste/Zahnstreifen wurden daraufhin bereinigt. Auf weiteren
Nutzerwunsch besitzt die überarbeitete Mundtextur einen oberen Zahnrand, einen
kleinen Anime-Eckzahn und einen rosigen Zungenbereich, angelehnt an das Logo. Auf Wunsch kamen
sanftes Atmen, Gewichtsverlagerung und kleine gemeinsame Kopf-/Haarneigungen dazu.
Die komplette Ausdrucks-/Outfit-Vorgabe ist damit noch nicht erfüllt.

Private Arbeitsdateien: `/home/dreimer/shares/music/Luna/Luna-Local-home-tools/Luna-portrait-v1/`.
Darin liegen `luna-face-runtime.cmo3`, `source-layers`, `original-export` und `model`.
Das CMO3 ist der Editorstand mit 2048er Atlas; die letzte Mundbereinigung erfolgt
reproduzierbar **nach** dem Export mit `tools/polish_luna_mouth.py`. Ein erneuter
CMO3-Export allein enthält diese Bereinigung nicht. Das Skript prüft den SHA256 des
Originalatlases, damit es nicht versehentlich einen anderen Atlas beschädigt.
`model/luna.model3.json` benötigt `LunaRig.Profile = portrait-face-v1`.

Der Nutzer hat lokale pixelgenaue Bildbearbeitung ausdrücklich autorisiert.
Die verworfenen SVG-/PNG-Verformungsversuche nicht reaktivieren. Die bisherigen
Materialstudien sind Zwischenstände; für Fortsetzung das aktuelle private Paket
verwenden. Fremde Vorlagen, SDK/Core und daraus abgeleitete Studien bleiben privat.

## Rechner einrichten

### Windows für den Cubism Editor

Auf dem Arbeits-PC: **Cubism Editor 5.3.05 beta1**, FREE-Modus; keine PRO- oder
Testlizenz aktiviert. Für dieses Referenzprojekt möglichst dieselbe Version
verwenden und späteres Speichern mit anderen Versionen an einer Kopie testen.
[Offizieller Download](https://www.live2d.com/en/cubism/download/editor/).
Live2D bietet den Editor offiziell für Windows/macOS, nicht Linux an.

Das aktuelle private `Luna-portrait-v1/luna-face-runtime.cmo3` öffnen.
`luna-reference-only.cmo3` ist nur das historische Referenzprojekt.

### Windows oder Linux für Code und Browser

- Node.js 24 (lokal geprüft mit 24.20.0), npm; Python 3.14 für bestehende HA-Tests.
- Offizielles **Cubism SDK for Web 5 R5**, vollständig entpackt, inklusive `Core`,
  `Framework`, `Samples`. Auf dem bisherigen PC: `Downloads/Cubism/CubismSdkForWeb-5-r.5`.
- MotionSync Web R3 liegt im privaten Cubism-Tools-Ordner, ist aber noch nicht
  integriert. Aktuell wird das reale Wiedergabeaudio spektral angenähert.

```sh
cd tools/live2d
npm ci
npm run build -- /pfad/zu/CubismSdkForWeb-5-r.5 --sample
node smoke.mjs
```

Unter Windows für den SDK-Pfad z. B. `C:\Users\NAME\Downloads\Cubism\CubismSdkForWeb-5-r.5`
verwenden. Der Test nutzt dort standardmäßig Microsoft Edge. Unter Linux zuvor
`npx playwright-core install chromium` ausführen; benötigte Linux-Systembibliotheken
für Chromium müssen installiert sein. Linux wurde hier nicht ausgeführt.
`LUNA_BROWSER_CHANNEL` kann den Browserkanal überschreiben.

`dist/smoke.png` ansehen. Der Test prüft echte Core-/MOC3-/Textur-/Shader-Ausgabe,
Parameter, Abbruch, fehlende Dateien und mehrfaches Freigeben. Er ist kein Test
von Lunas fertiger Mimik, deutscher Sprache oder tatsächlicher Tablet-Leistung.

Python-/Frontend-Tests aus dem Repository-Hauptordner:

```sh
python -m venv .venv
# Windows: .venv\Scripts\python ; Linux: .venv/bin/python
python -m pip --python .venv install -r requirements-test.txt
node --test tests/test_avatar_session.mjs
```

Für die Python-Tests den Interpreter aus `.venv` benutzen; unter Windows
`.venv\Scripts\python -m unittest discover -s tests`, unter Linux
`.venv/bin/python -m unittest discover -s tests`. Ein globaler Python-Aufruf allein
aktiviert die Umgebung nicht automatisch.

## Nicht in Git und nicht automatisch synchronisiert

- Cubism-Installer, proprietärer Core/SDK, generierte Runtime und fremde SDK-Modelle:
  lokal installieren/bauen. Die Veröffentlichung der integrierten Runtime ist
  lizenzrechtlich noch nicht geklärt. Bezugsquellen stehen in `docs/live2d/README.md`.
- `node_modules`, `.venv` und Compiler-Ausgaben: reproduzierbar neu anlegen.
- Git-/HA-Anmeldung, Passwörter, Tokens und lokale Speicherdateien: keine Kopie ins
  öffentliche Repository. Auf dem Heim-PC separat anmelden. Die Chat-Sitzung ist
  kein verlässlicher Zugangsdaten-Transfer.
- Lunas Erinnerungen bleiben auf der HA-Instanz; sie müssen beim PC-Wechsel nicht
  nach Git oder auf den Entwicklungs-PC kopiert werden.

Ein zusätzliches **lokales Werkzeugarchiv** unter
`Downloads/Luna-Local-home-tools.zip` enthält den vorhandenen Installer und das SDK
ohne npm-/Build-Ausgaben. Es kann privat auf den Heim-PC übertragen werden, ist
aber nicht Bestandteil des öffentlichen Git-Repositorys. Der frühere offizielle
SDK-Download wurde hier mit HTTP 403 blockiert; das Archiv vermeidet einen erneuten
Download beim Rechnerwechsel.
Die Prüfsummen des Archivs, Installers und Core stehen in
`docs/live2d/toolchain.json`.

## HA-Stand und nächste Schritte

- Manuell installiert: Entwicklungsversion **0.4.0b4**. HA wurde neu gestartet.
- Vorhandene Karte: Hauptdashboard `/lovelace/test`, `views[4].cards[5]`.
  `avatar: live2d`, Laufzeit `/local/luna/runtime-20261027-hands/runtime.mjs`, Modell
  `/local/luna/model-20261027/luna-smile2.model3.json`. Die neuen Verzeichnisse vermeiden
  alte Browser-/Service-Worker-Caches. Andere Kartenlayouts wurden nicht geändert.
- Sicherung vor Deployment: `/home/dreimer/shares/music/Luna/backups/20261027-live2d-ha/`
  mit altem `frontend`, `control.py`, `manifest.json`, `lovelace.lovelace`.
- Pipeline: `conversation.luna_lokal`, vorhandene HA-Cloud-STT/TTS, Stimme AmalaNeural.
  Der lokale Piper/Kerstin-Test ist nur ein Entwicklerfixture und ersetzt die
  konfigurierte Produktionsstimme nicht. Kein Offline-Sprachversprechen.
- Entdeckter und korrigierter Fehler: `async_recognize_intent` ohne
  `strict_intents_only=True` behandelte normale Fragen als unbekannte Geräte.
  Jetzt gehen nur strikte Treffer auf exponierte Entitäten in den Steuerpfad.
- 19 Node-Tests bestanden; 5 HA-Control-Tests gegen HA 2026.10.3 bestanden.
  Hiyori-Smoke testet Kontextverlust/Fallback/Abbruch. Luna-Smoke prüft echte
  gerenderte Pixeländerungen für Mund, Blinzeln und Leerlauf sowie exakte
  Wiederherstellung ohne Bewegungsdrift bei reduzierter Bewegung.
- Lokaler deutscher WAV-Test mit echter LunaSession bestand: Mundbewegung während
  Audio, Mund sofort geschlossen nach Stopp. Erste echte HA-TTS-Wiedergabe ebenfalls
  gemessen (245 sprechende Frames, maximale Mundöffnung ca. 0.65, danach 0).
  Diese erste Antwort war noch der oben beschriebene Gerätefehler; nicht mit einer
  erfolgreichen freien KI-Antwort verwechseln. Nach Korrektur gelang die freie
  KI-Antwort auf „Wer bist du?“ mit 1236 sprechenden Frames, max. Mundöffnung
  0.849 und anschließend geschlossenem Mund (0), ohne Sitzungsfehler.
- Vergrößerte Ansicht gegen echte KI/TTS geprüft: gleiche LunaSession, 736
  sprechende Frames, max. Mundöffnung 0.84998. Gezielter Stopp während der
  Wiedergabe: Phase idle, Mund 0, Audioquelle gestoppt. Nutzerfeedback zur
  Zahnkante anschließend umgesetzt: Zahnrand liegt direkt unter der Oberlippe.
- Physisches Browser-Mikrofon/STT wurde in diesem Durchlauf noch nicht geprüft.
- Ausdrucksvielfalt, eigenständige Haarphysik, echte Kopfdrehungen und MotionSync
  bleiben weitere Arbeiten; keine vollständige Rig-Contract-Erfüllung behaupten.

Nach dem Weiterarbeiten Code/Tests/Dokumentation committen und auf
`work/luna-live2d-preparation` pushen. Private SDK-/Vorlagen-/Runtime-Dateien nicht
in das öffentliche Repository aufnehmen. Die private Modelldatei muss beim
Rechnerwechsel zusätzlich über das gemeinsame Luna-Verzeichnis verfügbar sein.

Letzte Ergänzung auf Nutzerwunsch: sanfte Handgelenk- und Fingerbewegungen im
Leerlauf. Die zwei Illustrationsmeshes werden zur Laufzeit unterteilt, UVs bleiben
registriert. Bewegungen sind klein und zeitlich versetzt; Winken ist nicht Teil
dieses Stands. Mundtextur und Blinzeln bleiben unverändert. Alle 19 Node-Tests,
SDK-Smoke und Luna-Pixeltest bestanden. Der Nutzer möchte jetzt selbst testen;
keine weiteren Funktionen hinzufügen.

Git-Push scheiterte an fehlender HTTPS-Anmeldung; SSH war ebenfalls nicht
vorbereitet. Lokale Commits und zusätzliche Git-Bundle-Sicherung im privaten
Luna-Verzeichnis erhalten den Stand unabhängig von der Anmeldung.


## Ergänzung 27.10.2026: Raumantworten und Smileys (0.4.0b5)

Auf weiteren Nutzerwunsch folgt der geöffnete Avatar jetzt den Antworten aus
Lunas dauerhaftem Lauschen im Wohnzimmer und Schlafzimmer. PipelineSpeech
verwendet für Lautsprecher und Browseranalyse denselben aufgelösten TTS-Stream.
Der tatsächliche Player-Zustand startet/stoppt die Animation; der Browser decodiert
nur stumm per OfflineAudioContext. Physische Lautsprecherpuffer können einen kleinen
Zeitversatz verursachen. Eine lokale Browserunterhaltung hat Vorrang. Optional
lässt sich das Folgen mit `follow_rooms: false` pro Karte ausschalten.
Dies betrifft den Luna-Lauschen-Pfad, nicht beliebige fremde Assistenten/TTS-Ausgaben.

Unicode-Emojis und übliche ASCII-Smileys werden vor TTS herausgefiltert, sowohl im
Luna-Conversation-Agent als auch defensiv im Raum-Sprachadapter. Originalantwort
und Marker bleiben in Metadaten erhalten; die Zuordnung dieser Marker zu neuen
Avatar-Launen ist ausdrücklich noch nicht umgesetzt. Das akzeptierte Modell,
Blinzeln, Zähne und die Handbewegungen bleiben unverändert.

Validierung: 43 Python-Tests, 22 Node-Tests und 10 Sprachadapter-Tests gegen
HA 2026.10.3 bestanden. Echter Luna-WebGL-Test mit stummer WAV-Auswertung:
maximale Mundöffnung 0.7345, nach Abbruch 0, kein hörbarer AudioContext erzeugt.
Zusätzlich 5 HA-Control-Tests bestanden. Nach Installation und HA-Neustart ist
das b5-Frontend geladen und die Raum-WebSocket-Verbindung erfolgreich abonniert.
Ein echter Conversation-Aufruf lieferte drei Emojis im Original; alle drei waren
aus `speech.plain.speech` entfernt und in `extra_data.luna` erhalten.
Die Prüfung des tatsächlichen Raumlautsprecher-Timings steht noch aus; beide
Lausch-Schalter waren beim Abschluss aus. Der Nutzer wurde um den Praxistest gebeten.

Backup vor Installation: `/home/dreimer/shares/music/Luna/backups/20261027-room-playback-b4/`.
Für Rollback die dortige `luna_local`-Integration wiederherstellen, HA neu starten
und die manuelle Lovelace-Ressource auf die vorherige Version zurückstellen.
Die manuelle Ressource wurde für b5 auf `/luna-local/luna-avatar-card.js?v=0.4.0b5`
aktualisiert; bestehendes Dashboardlayout und private Modell-/Runtime-Pfade bleiben.


## Korrektur 0.4.0b6: Rückfragen ohne neue Äußerung

Nutzer bestätigt Mundbewegung bei Raumantworten, meldet aber wiederholte
Rückfragen und eine unpassende Antwort nach nur einer Äußerung. Live-Zähler im
Wohnzimmer: sechs Transkripte, vier Antworten, vier unklare Abschnitte, null
textuell erkannte Echos. Kein Audiomitschnitt: die genaue Herkunft der zusätzlichen
Transkripte lässt sich rückwirkend nicht beweisen.

Korrigiert: Eingehende PCM-Frames während TTS-Vorbereitung/physischer Wiedergabe
und einer Sekunde Nachhall werden vor der Segmentierung verworfen. Transport und
Lausch-Schalter laufen weiter. Alle konfigurierten Räume berücksichtigen Lunas
Ausgabe, damit sich nahe Geräte nicht gegenseitig anregen. Damit ist kein
Dazwischensprechen während Luna-Ausgaben möglich. Das ist eine zeitliche Sperre,
keine akustische Echo-Unterdrückung. Fremde Gespräche/Fernsehen bleiben eine Grenze
des offenen Lauschens. Leere STT-Texte gehen nicht mehr an das Gesprächsmodell.
Nur eine Rückfrage bis zur nächsten klaren Äußerung; eine Rückfrage verlängert
nicht das Gesprächsfenster. Diagnose ergänzt um
`eigene_ausgabe_frames_verworfen` und `leere_transkripte_verworfen`.

45 Python-Tests und sieben Tests mit HA 2026.10.3 bestanden, darunter echte
Room.receive-/STT-Worker-Tests für Fremdraum-Ausgabe, Nachhall, Wiederaufnahme und
leeres STT. Backend b6 installiert; Frontend/Modell unverändert. Backup der drei
ersetzten Dateien: `/home/dreimer/shares/music/Luna/backups/20261027-listening-b5/`.

Live-Prüfung nach bestätigtem Neustart: b6-Diagnosezähler vorhanden, Wohnzimmer
weiterhin aktiv. Ein gesprochenes Testsignal führte zu genau einem Transkript und
einer Antwort. 230 eigene Ausgabe-/Nachhall-Frames verworfen; danach wieder
`listening`, leere Warteschlangen, kein Fehler. Noch 97 Sekunden nach Übergabe der
Antwort unverändert ein Transkript/eine Antwort, keine Rückfrage-Schleife.
Modelllaufzeit dieser Antwort 48.08 s (Prompt 35.699 s, Generierung 7.916 s).
Eine zweite Nutzerfrage zur praktischen Wiederaufnahme steht noch aus.


## Tablet-Link: reine Luna-Ansicht

Direkter Link: https://ha.dreimer.de/luna-vollbild/luna
Separates Storage-Dashboard `luna-vollbild`, nicht in der Seitenleiste, normale
HA-Anmeldung auch für Nicht-Admins. Konfiguration in `docs/luna-tablet-dashboard.json`.
Vorhandenes kiosk-mode blendet Header/Sidebar nur in diesem Dashboard aus.
Die Karte unterstützt `display_only: true`: volle Fensterfläche, keine Bedienelemente,
kein Browser-Mikrofon und keine doppelte Tonausgabe; Raumantworten werden weiter
stumm analysiert. Antippen fordert Browser-Vollbild an. Screen Wake Lock wird
bei unterstützenden Browsern angefordert, bei Rückkehr erneut erworben und beim
Verlassen freigegeben. Tablet-/Browser-Unterstützung kann variieren; für iPad o.ä.
kann eine Homescreen-Verknüpfung zweckmäßig sein.

Live in Chrome geprüft: nur Luna mit Mondhintergrund, nach Antippen auch keine
Browserleisten; `followingRooms: true`, `controls: none`, `wakeLock: true`.
Backend bleibt b6, Frontend-Ressource für Cachewechsel auf
`/luna-local/luna-avatar-card.js?v=0.4.0b6-tablet1`. Keine HA-Neustart erforderlich.


## Transparenter Hintergrund und Esszimmer-Diagnose

`background: transparent` ergänzt: Stage, Kartenhülle, Panel und Popup transparent,
kein Mond/Backdrop. Display-only entfernt auch seine eigene Hintergrundfläche.
Vollbild fordert bei transparent die gesamte Dokumentseite an, damit vorhandene
animierte Dashboard-Hintergründe mit sichtbar bleiben. Als optionale Einstellung live mit vorhandenem animierten Hintergrund geprüft.
Auf Nutzerkorrektur bleibt Mond im Tablet-Dashboard eingestellt; transparent ist
ausschließlich mit `background: transparent` zu wählen. Hauptdashboard unverändert.
Ressource: `/luna-local/luna-avatar-card.js?v=0.4.0b6-transparent1`.

Esszimmerlicht: Exponiert, Alias Esszimmerlicht vorhanden, verfügbar. Exakter Text
`Schalte das Esszimmerlicht aus` über native HA-Conversation erfolgreich; Zustand
wechselte tatsächlich auf off. Danach exakter Text `Luna schalte das Esszimmerlicht aus`
über conversation.luna_lokal ebenfalls sofort erfolgreich. Sprachversuch weiterhin
nicht eindeutig geklärt: damalige STT-Wortlaute nicht gespeichert. Nicht als behoben
behaupten. Keine Änderungen am Steuerpfad auf Verdacht vorgenommen.

## Bearbeitungszugang für die Vollbildkarte

`/luna-vollbild/luna?disable_km` deaktiviert jetzt zusätzlich zur vorhandenen
kiosk-mode-Oberfläche die fest positionierte display-only-Darstellung der Karte.
Gespeichertes `display_only` bleibt unverändert. Ohne Parameter gilt weiterhin
Vollbild. Live geprüft: Header und Stift erreichbar, Karten-YAML-Editor geöffnet,
Vorschau bleibt innerhalb des Editors. Hintergrundwahl bleibt beim Nutzer.
Frontend-Ressource auf `0.4.0b6-edit1` aktualisiert.
