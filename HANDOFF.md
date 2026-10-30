# Luna zu Hause fortsetzen — Übergabe 27.10.2026

## Automatisches seitenübergreifendes Sprech-Popup, 30.10.2026 / b11

auto-popup.mjs wird über das bereits global registrierte Extra-JS geladen und
lebt unabhängig von Dashboard-Kacheln. Holt hass vom home-assistant-Element,
abonniert RoomPlayback, übernimmt das Avatar-Design einer vorhandenen Kachel
oder aus lovelace/config des Standard-Dashboards. Lokale Kachel-Sprechphasen
werden über luna-avatar-state gemeldet und deren Session nur visuell gespiegelt.
Popup ohne zusätzliche Audioausgabe/Mikrofon; Lippenbewegung folgt dem bestehenden
Raum-Audio oder der lokalen Session. Kein Seitenwechsel.
Schließt mit 3 Sekunden Nachlauf. Schließen/Escape unterdrücken dieselbe Antwort;
eine neue Antwort darf wieder öffnen. Bereits offenes Avatar-Popup bzw.
Display-only-Vollbild erhält keine zusätzliche Kopie. Nur im sichtbaren HA-Tab;
kein Betriebssystem-Fokuswechsel oder Aufwecken einer geschlossenen HA-App.
RoomPlayback-Fallback bei fehlendem Ende bleibt auf dessen 5 Minuten begrenzt.

5 Timing-/Room-Tests bestanden. Browser-Test auf fremder Route ohne Avatar-Kachel:
animiertes Popup, keine zweite AudioContext-/Mikrofoninstanz, automatisches Ende,
manuelles Schließen, nächste Antwort, unveränderte URL, keine Browserfehler.
HA: b11 Frontend/Manifest/Ressource installiert und Standard-Dashboard-Konfiguration
live geprüft; kein HA-Neustart. Nutzer muss HA-Seite neu laden.
Backup und Browser-Nachweis: backups/avatar-auto-popup-20261030.


## Avatar hinter Bedienfeldern, 30.10.2026 / b10

Die Stage liegt absolut über der gesamten Panelhöhe (Kachel maximal 900 px /
94dvh, Popup 90dvh). Die bisherigen getrennten 640 px Avatar plus Eingabebereich
entfallen. Bedienfelder liegen halbtransparent am unteren Rand darüber und
scrollen bei Platzmangel separat; Modell/Zoomwahl/Transparenz bleiben erhalten.
Desktop mit Hover und feinem Pointer: Felder erscheinen bei Mouse-over der
Kachel oder Tastaturfokus innerhalb der Felder. Touch: dauerhaft sichtbar.
Keine Höhenänderung beim Einblenden.
Live2D zeichnet auch in offenen nativen Dialogen, wenn IntersectionObserver
wegen des leeren ursprünglichen Card-Hosts fälschlich Unsichtbarkeit meldet.
Frontend und Manifest b10 sowie Lovelace-Ressource installiert, kein HA-Neustart.
Backup: backups/avatar-overlay-20261030.


## Kachel-Aufnahme bis Fertig oder 3 Sekunden Stille, 30.10.2026 / b9

Die Mikrofonaufnahme setzt bei assist_pipeline/run jetzt input.no_vad=true.
Damit entfallen HAs externe 0,7-s-Enderkennung und 15-s-VAD-Begrenzung für
diese Kachel. Kein globaler Eingriff in Satelliten oder HA-Core.
Der AudioWorklet beendet nach mindestens 3 Sekunden zusammenhängender Ruhe,
nachdem mindestens 200 ms zusammenhängendes hörbares Audio erkannt wurde.
20-ms-RMS-Fenster, Schwelle 0,006 nach Browser-Rauschunterdrückung; dies ist
eine konservative Pegelerkennung, keine semantische Sprachklassifikation.
Geräusche können die Aufnahme verlängern. Anfangsstille wird nicht automatisch
als leere Anfrage abgeschickt. Fertig funktioniert weiterhin sofort und flusht
den letzten PCM-Block. Keine zusätzliche Modusauswahl.
Technische Gesamtfrist für Audio-Pipeline 600 Sekunden einschließlich Antwort,
für Text weiterhin 120 Sekunden.

17 Session-/Worklet-Tests bestanden, darunter 20 Sekunden fortlaufendes Audio,
Pause 2,98 s, Neustart der Pause und Ende bei 3 s bei 16/44,1/48 kHz.
Live-HA akzeptierte no_vad und 20 Sekunden PCM ohne frühes STT-Ende;
Prüflauf nur bis STT, ohne Agentenanfrage. Echtes Mikrofon muss der Nutzer testen.
Frontend und Manifest b9 installiert, Lovelace-Ressource auf b9 aktualisiert;
kein HA-Neustart nötig. Backup: backups/voice-pause-20261030.


## Anschlusskorrektur an Händen und Torso, 30.10.2026

Aktuelle private Quelle: `joint-material-20261030/luna-joint-material-20261030.cmo3`.
Finaler Export und Rückfallkopie dort unter `final-export/` und `ha-model-before/`.
Die neue Quelle enthält zwei kleine statische Handverschiebungen unter die Bündchen
und einen erweiterten Mesh-Randpunkt (ArtMesh10, Vertex 14). Dadurch verschwindet
der kantige Einschnitt an der Taille. Keine neuen Gelenk-Keyforms; Mao und Chitose
bleiben unverändert. Die ursprüngliche Pullovertextur ist ausreichend;
die probeweise generierte Textur wurde NICHT übernommen.

Die alten ruhenden Luna-Arme hatten falsche Drehpunkte. Ihre synthetische
Idle-Ansteuerung bleibt deshalb auf neutral; Blinzeln, Mimik, Atmung und native
angehobene Arme bleiben verfügbar. Das ist keine Reparatur dieser alten Gelenke
und keine zusätzliche Fingerbewegung.

Nach Reexport weiterhin die freigegebene Mundtextur per
`restore-portrait-atlas.mjs` einsetzen und LunaRig-Metadaten beibehalten.
Der Modellpfad bleibt für vorhandene Zoom-Einstellungen unverändert.
Aktuelle Runtime: `/local/luna/runtime-native-donors-joints-20261030/runtime.mjs`.

Lokal und auf HA: Winken, Mund, Blinzeln, Animation und exakte Rückkehr bestanden.
15 Mundkombinationen entsprechen weiterhin dem freigegebenen V9-Vergleich.

Prüfung: `chitose-transfer-audit.mjs --integrated --joint-correction`
erlaubt ausschließlich die drei exakt bezifferten statischen Anpassungen;
alle übrigen bestehenden Meshes bleiben unverändert. Der historische Aufruf
ohne Zusatzflag prüft weiterhin den alten, vollständig unveränderten Export.


## Mundkorrektur nach nativem Export, 29.10.2026

Der neue Export enthielt wieder den ungepatchten Gesichtsatlas (SHA256 a54acfad…)
statt der freigegebenen Mundfassung (95d0403d…). Alle Gesichts-UVs und Texturindizes
sind gegenüber V9 identisch. `texture_00.png` wurde deshalb bytegleich aus der
freigegebenen V9-Fassung wiederhergestellt, ohne neue Zeichnung oder Geometrie.
`tools/live2d/restore-portrait-atlas.mjs` prüft beide vollständigen Hashes und
verweigert unbekannte Atlaslayouts. Nach JEDEM CMO3-Reexport diesen Schritt
anwenden; die CMO3 selbst enthält weiterhin die ungepatchte Portraittextur.

`native-avatar.mjs` übernimmt wieder die bisherigen Portrait-Parametergrenzen:
Mundform ±0,35, unabhängige Template-Kopf-/Körper-/Brauen-/Blickverschiebung 0.
Mundöffnung, Blinzeln, Blush und originale Armparameter bleiben nutzbar.
Kein synthetisches Gelenk oder neue Armverformung hinzugefügt.

15 Kombinationen aus Mundöffnung und Mundform mit V9 verglichen. Maximale
RGB/A-Kanalabweichung 10/255, mittlere Abweichung unter 0,145/255; kleine
Rasterunterschiede durch die alte Mesh-Unterteilung, keine Pixelidentität behaupten.
Nahansicht visuell geprüft. Native Bewegung/Mund/Blinzeln/Rückkehr-Test bestanden.
Aktuelle Runtime in Hauptkarte und Vollbild:
`/local/luna/runtime-native-donors-mouthfix-20261029/runtime.mjs`.
Modellpfad bleibt gleich, damit die gespeicherte Zoomwahl erhalten bleibt.
Runtime validiert Modell-/Textur-Cache beim Laden neu.
Private Sicherung: `chitose-study-20261029/mouth-backup-20261029-183319/`;
korrigierter Export und Nachweise daneben unter `integration-export/` und
`native-mouth-check/`.

## Aktuell installiert: 0.4.0b8, natives Modell und Assistentenwahl

Nutzer hat die Umstellung trotz fehlender Sauer-/Hüft-/Verschränkformen ausdrücklich
freigegeben. Hauptkarte und `/luna-vollbild/luna` sind per Lovelace-API auf
`model-native-donors-20261029` + `runtime-native-donors-20261029` umgestellt.
Keine Änderung der ursprünglichen Armformen. Die separate Vorschau bleibt erhalten.

Neues Auswahlfeld **Sprachassistent**: Luna Lokal oder Luna (Gemini); browserlokal
pro Dashboard gespeichert. Wechsel beendet die alte Sitzung und verwirft deren
Conversation-ID. Gemini nutzt kein lokales Luna-Gedächtnis und keine zusätzliche
Ollama-Emotionsabfrage. Neuer TTS-Endpunkt filtert Emoji auch für externe Agenten
und verwendet die gewählte Pipeline-Stimme. Emoji-only bleibt stumm.

Live-Test in authentifizierter HA-Avataransicht: Gemini und anschließend Luna
Lokal antworteten korrekt auf die Paris-Frage, spielten Audio ab und erreichten
wieder idle ohne Fehler. Gemini ca. 23 s, Luna Lokal ca. 25 s einschließlich
Wiedergabe; Lippenbewegung im gemeinsamen Renderpfad gemessen. 28 Node-Tests und
8 Python-Avatar-Tests bestanden, HA-Konfigurationscheck bestanden.

Ollama hatte reproduzierbar nur „nonono…“ ausgegeben. Gezielter App-Neustart
behob den beobachteten Zustand; anschließend korrekte direkte und HA-Antworten.
Keine Behauptung einer bewiesenen dauerhaften Fehlerursache. Die alte HA-Vorlade-
automation wurde auf 4096 Kontext passend zur Unterhaltung und nur HA-Start
umgestellt; `keep_alive=-1` bleibt. Vorladen danach in Millisekunden, Modell bleibt
resident. Kein Modellwechsel oder Löschen von Erinnerungen.

Backup vor Installation: `backups/ha-native-gemini-20261029-134430/` in der privaten
Luna-Ablage. Ein zwischenzeitliches Installieren des alten Git-Stands setzte HA
auf b7 zurück; Nutzer bestätigte ein zuvor angebotenes Git-Update. b8 erneut
installiert und tatsächlich ausgelieferte Oberfläche danach live getestet.
Git muss vor weiteren HACS-Updates denselben Versionsstand enthalten.

## Chitose in Luna/Mao integriert, 29.10.2026

Nutzer hat den Einbau freigegeben. Rechter Chitose-Winkarm mit Luna-Strickmaterial
und originalen Gelenkformen in die bestehende Luna/Mao-Kopie eingebaut.
Schulteranschluss durch Platzierung der ganzen Kette korrigiert. Keine neue
Gelenkkonstruktion, keine Browser-Vertexverformung im neuen Runtime-Profil.
Details/Quellen/Grenzen: `docs/live2d/chitose-study.md`.

**Aktuelle Vorschau:** https://ha.dreimer.de/local/luna/native-donors-20261029.html
Winken, Ruhehaltung, linke Mao-Haltung und Sprechmund per Schaltfläche.
Geometrieprüfung: 21 Chitose-Stellungen, max. 0,002940 Quellpixel Abweichung;
31 V9- und vier Mao-Meshes neutral exakt unverändert. Runtime-Prüfung lokal und
auf HA bestanden, einschließlich exakter Rückkehr, Mund, Blinzeln und Bewegung.
Private Quelle `chitose-study-20261029/luna-chitose-integration.cmo3`,
`integration-export/` und `integration-checks/`. Finaler Wine-Export:
`C:\LunaNative\chitose-aligned-export` (älterer integration-export hat Schulterspalt).
Runtime-Profil `native-donors-v1`, neue Parts `PartLunaWaveR`, `PartLunaRaisedL`.

Weiterhin A/B-Überblendung statt durchgehendem Armheben. Winkfinger nicht einzeln
steuerbar; native Hüft-/Verschränkposen fehlen. Die normale HA-Karte verwendet
inzwischen diesen Stand; Details zur freigegebenen Umstellung siehe oben.
Die älteren Abschnitte unten beschreiben Zwischenstände, nicht den aktuellen
Integrationsstatus. Zwei vollständige Modelle wurden nicht verschmolzen;
intakte Armketten aus Mao und Chitose sind jetzt gemeinsam in Luna eingebaut.

## Verbindliche Nutzervorgabe nach der Winkstudie, 29.10.2026

Einziger freigegebener Weg: intakte Armbewegung der Originalvorlage erhalten
und Lunas Ärmel und Hände daran anpassen. Zuerst einen vollständigen Arm samt
Übergängen sichtbar prüfen. Bestehendes Gesicht und HA-Anbindung erhalten.
Keine Fortsetzung der Einzelreparaturen als Hauptlösung und keine zusätzlichen
Browser-Verformungen als Ersatz für den intakten Rig. Eine Abweichung benötigt
vorher einen konkret genannten triftigen Grund und ausdrückliche Nutzerfreigabe.
Die native Winkstudie unten ist ein Vergleichsartefakt, kein fertiger Körper-Rig.
Zwei vollständige Bewegungsmodelle wurden bisher NICHT zusammengeführt.
Mao ist als übernommene Vorlage belegt; Hiyori bisher nur als Player-Testmodell.
Die Identität einer ursprünglich empfohlenen zweiten Rig-Basis ist noch nicht
eindeutig belegt. Keine weiteren Erfolgsaussagen aus Parameternamen oder bloßer
Pixelbewegung ableiten.

### Neuer Stand: intakte linke B-Arm-Kette übernommen

`docs/live2d/intact-mao-arm.md` ist die aktuelle Fortsetzung. Originale Mao-Kette
mit vier ArtMeshes übernommen, zwei Ärmel mit Luna-Strickmaterial versehen,
Hand/Finger original erhalten. In separater V9-Kopie unter Shoulder L eingesetzt.
625 Parameterkombinationen gegen unverändertes Mao geprüft: max. 0,014 Quellpixel
Abweichung nach fester Skalierung/Platzierung. Die 28 übrigen V9-ArtMeshes sind
in Neutralstellung exakt unverändert. Privat: `intact-mao-arm-20261029/`.
Vorschau: https://ha.dreimer.de/local/luna/intact-arm-20261029.html
Noch offen: gesenkte A-Variante/Übergang, offene Winkhand, Körperkombinationen,
rechte Seite. Normale HA-Karte unverändert. Alte Abschnitte unten sind historisch.

### Nachfolgende Originalprüfung: Übergangsgrenze erkannt

**Aktueller Nachtrag:** Chitose wurde danach ausdrücklich freigegeben und geprüft.
Siehe `docs/live2d/chitose-study.md`. Offene Winkhand samt vollständiger rechter
B-Kette separat extrahiert; 21 Parameterstellungen gegen Original geprüft,
max. 0,003321 Quellpixel Abweichung. Keine Integration in Luna bisher. Auch diese
Vorlage nutzt A/B-Überblendung, kein natürliches durchgehendes Armheben.
Private Daten: `chitose-study-20261029/`; lokales Original/Arm-Preview:
http://127.0.0.1:8792/tests/chitose-study.html . Die folgende Freigabe-Anforderung
ist für Chitose inzwischen erfüllt, für neue Eigenkonstruktionen weiterhin nicht.

Mao A/B sind getrennte Zeichnungen mit 0,5-s-Deckkraftwechsel, keine durchgehende
Hebebewegung. Alle acht Originalmotions und SDK-Posecode geprüft. Diagnose
`tests/mao-arm-variants.html`, Audit `tools/live2d/mao-variants-audit.mjs` bestanden.
A-Kette noch nicht zusätzlich übernommen, da dies die fehlende Hebebewegung und
offene Winkhand nicht löst. Hiyoris geprüfte B-Haltung ebenfalls keine offene
Winkhand. Chitose ist ein offizieller Kandidat mit beschriebener Winkfunktion,
aber noch ungeprüft und nicht als weitere Vorlage freigegeben. Vor Erweiterung
Nutzerentscheidung einholen; keine Eigenkonstruktion beginnen. Details in
`docs/live2d/intact-mao-arm.md`. In diesem Prüfungsschritt keine Luna-Modelländerung.

## Native Winkvorschau mit Formkorrekturen, 29.10.2026

https://ha.dreimer.de/local/luna/native-wave-20261029.html

Neue private CMO3 `native-arm-repair-20261029/luna-native-wave-forms.cmo3`
und `native-wave-export/`: Schulteransatz, Ellenbogenkontur und Handgelenk
der linken B-Kette korrigiert. ParamLunaArmRaise verbindet originale Ruheform
mit gehobenem Arm. ParamArmLB03 winkt nur bei vollständig gehobenem Arm.
Vorschau benutzt nativeRig:true, keine zusätzliche Arm-/Körperverformung.
Lokaler und HA-Browsertest bestanden: Arm/Hand/Mund/Blinzeln bewegen sich,
Ruhehaltung nach Sequenz exakt wiederhergestellt. Details, Grenzen und
Bedienhinweise in `docs/live2d/native-arm-repair.md`.
Noch keine Umstellung der normalen HA-Karte; andere Posen/Armseite und alte
Parameterkombinationen sind nicht durch diesen begrenzten Arbeitsstand behoben.

## Priorität: nativen Arm-Rig reparieren, 29.10.2026

Nutzer lehnt Gummiarm der Runtime-Studie ab und verlangt echte Gelenke aus dem
fertigen Mao-Modell. Outfit-Ausbau zurückgestellt. Direkter Vergleich ohne
Runtime-Verformung zeigt: Maos B-Arm ist angehoben angelegt, Lunas übertragener
B-Arm bleibt bei denselben Parametern unten. Dokumentation und Diagnoseansicht:
`docs/live2d/native-arm-repair.md`, `tests/native-arm-study.html`.
Separate V9-CMO3-Arbeitskopie unter `native-arm-repair-20261029/` im privaten
Luna-Verzeichnis. KDE-Eingabe inzwischen freigegeben. Separater nativer
Pivot-Versuch `luna-native-elbow-pivot-study-NOT-RELEASE.cmo3` gesichert:
Ellbogenlücke in Testhaltung geschlossen, aber doppelte Ärmelkontur und offene
Schulternaht bleiben. Nur einzelne Form geändert, noch keine fertige Animation.
Details/Winkel/Screenshots und Wine-Speicherumweg in der Reparaturdokumentation.
Nächster Schritt sind native Formkorrekturen für gehobene B-Pose und konsistente
Keyforms; nicht erneut Browser-Verformungen oder Diagnosepose ausrollen.
Original-Ganzkörper-Regressionsprüfung unverändert bestanden.

## Bewegliche Winterstudie, 29.10.2026

Separate Vorschau: https://ha.dreimer.de/local/luna/winter-study-20261029.html
Wintermantel/Original-Pullover im selben Player umschaltbar; bestehendes Gesicht,
Blinzeln, Mund und V10-Posen bleiben aktiv. Zusätzliche Runtime-Kleidungsebene,
kein neu bearbeitetes CMO3/MOC3. Bildmaterial und reproduzierbarer Aufbau stehen
in `docs/live2d/outfits/README.md`. Normale HA-Karten/Integration bleiben V10.
Prüfung: 37 Node-Tests, Original-Ganzkörper-Smoke und Winter-Posentest bestanden.
Winter: Mund 120 / Blinzeln 588 geänderte Pixel; nach Outfitwechsel pixelgenau
wiederhergestellt, derselbe Player. Live-Vorschau und schmale Ansicht geprüft.
Noch offen: allgemeine persistente Kleiderwahl und Automationsauswahl, Sommer-/
Bademantel-Rig, bessere Handformen und native Cubism-Kleidungsquellen.

## Garderobenentwürfe, 29.10.2026

Drei neue statische Outfit-Referenzen in `docs/live2d/outfits/`: Sommer, Winter
und Bademantel mit Schulterhandtuch. Eingebautes imagegen-Werkzeug, vollständige
Prompts und konkreter Rig-Fahrplan im selben Ordner. Noch keine animierten
Outfits und keine Kleiderumschaltung im Live-Avatar. V10 bleibt unverändert.
Vergleich mit Zoom/Hintergrund: https://ha.dreimer.de/local/luna/outfits-20261029/index.html

## Aktuell: V10-Posen und Gesichtsausdrücke, 29.10.2026

Integration 0.4.0b7 ergänzt `luna_local.avatar_pose` und `luna_local.avatar_reset`.
Pose, Ausdruck, Stärke und Dauer (0,5–120 s) sind im HA-Aktionseditor auswählbar.
Transientes WebSocket-Kommando an alle Anzeigen, neue Aktion ersetzt alte;
Ablauf und Reset lassen Sprache weiterlaufen. `follow_automations:false` nimmt
Karten aus. 49 Python- und 34 Node-Tests bestanden. Live in HA geprüft: Winken
wird gerendert, läuft automatisch ab, kann ersetzt und zurückgesetzt werden.
Integration 0.4.0b7 und V10-Runtime installiert, HA erfolgreich neu gestartet.
Die Pose-Aktion selbst spricht nicht. Details und YAML: docs/browser-avatar.md.

V10 ergänzt die V9-Geometrie durch eine modellabhängige Runtime-Posenbibliothek.
Keine neue CMO3-Geometrie: Die bearbeitbare Quelle bleibt die V9-Datei; die neuen
Posen sind in `fullbody-pose.mjs`, `fullbody-motion.mjs` und `avatar-poses.mjs`.
Gemeinsame räumliche Verformung von Ober-/Unterarm verhindert abstehende
Überlappungen beim Beugen; Haut, Mund und Gesichtspatches werden gemeinsam bewegt.
Fingerzuordnung korrigiert: Hände sind ArtMesh2/7, nicht ArtMesh0/5 (Oberarme).

Enthalten: Lächeln, sauer, verlegen mit Blicksenkung/zusätzlicher Wangenfarbe;
Winken, beide Hände an Hüften, verschränkte Arme. Zufällige ruhige Leerlaufwechsel
alle 18–32 Sekunden mit weichen Übergängen: entspannt, eine Hand an der Hüfte,
verschränkte Arme. Mund/Blinzeln bleiben unabhängig. Stopp löscht alte Mimik;
unterbrochene Antworten dürfen ihre Geste nicht erneut starten. Raumgesten
berücksichtigen die bereits vergangene Audiozeit. Reduced motion unterdrückt
freiwillige Körperposen. Explizite Ausdrucksmarker werden bei expressions:false
ignoriert; der normale Leerlauf bleibt davon unabhängig.

Marker: 👋 einmal winken (5,5 s), 😡/😤 Hände an Hüften (12 s), 😠 Arme verschränken
(12 s), 🙂 lächeln, 🙈/😳/😅 verlegen. Danach Rückkehr zur normalen Haltung.
Vorschau: https://ha.dreimer.de/local/luna/poses-20261029.html (stumm, kein Mikrofon).
Runtime: `/local/luna/runtime-20261029-v10/runtime.mjs`; Modell bleibt unter dem
V9-Pfad, damit die gespeicherte Zoom-Auswahl erhalten bleibt.
Backup: `/home/dreimer/shares/music/Luna/backups/20261029-v10/`.
Privates Gesamtpaket: `/home/dreimer/shares/music/Luna/Luna-V10-2026-10-29.zip`.

Grenzen: Die Handzeichnungen bleiben die vorhandenen, entspannten Hände. Winken
ist daher keine neu gezeichnete offene Handfläche; Stoffmuster werden an starken
Beugungen gedehnt. Die Posen sind gezielt begrenzt, kein frei drehbares 3D-Skelett.

Nächster vom Nutzer gewünschter Ausbau nach dieser Posenrunde: Kleidung als
umschaltbare Varianten (Sommer, Winter, nach dem Bad mit Handtuch). Noch nicht
umgesetzt; Gesicht und bestehende Sprachfunktionen sollen erhalten bleiben.

## Historisch: V9-Ganzkörper mit beweglichem Gesicht, 28.10.2026

V9 ersetzt jetzt das Porträtmodell in beiden bestehenden HA-Karten. Der bewährte
Gesicht-Rig wurde aus der Cubism-Sicherung vom 27.10. 20:36 auf den V8-Körper
übertragen. Der statische Kopf wurde entfernt. Kragen-Mesh geschlossen; linkes
Hosenbein bis unter den Pullover verlängert und Zeichenreihenfolge auf 100 gesetzt.
Die Lächeln-/Zahntextur bleibt exakt die bisherige `texture_smile2.png`.

Privates Gesamtpaket: `/home/dreimer/shares/music/Luna/Luna-V9-2026-10-28.zip`.
Bearbeitbare Quelle: `head-integration-20261028/luna-v9-head-working.cmo3` unter
obigem Luna-Verzeichnis. Original-V8 und Office-Komplettpaket bleiben erhalten.
Runtime-Profil `fullbody-face-v1`: sanfte Arm-/Hand-/Fingerbewegungen, kohärenter
Kopf, Körper und Atmung; keine unbeschränkten Extremposen. Freiwillige Bewegung
wird bei reduced-motion abgeschaltet. Kopf-X/Y und Brauen bleiben begrenzt,
damit die Gesichtspatches nicht aus ihren Öffnungen wandern.

HA: `/local/luna/runtime-20261028-v9/runtime.mjs` und
`/local/luna/model-20261028-v9/luna.model3.json`. Vollbild weiterhin
`https://ha.dreimer.de/luna-vollbild/luna`; Mond im Vollbild und transparent in
der Testkarte erhalten. Zoom oben rechts, Ganzkörper/Hüfte; V9-Faktor 1.8,
auf schmalen Displays an Höhe angepasst. Auswahl pro Browser/Pfad/Modell.
Smiley-Marker steuern dezente lokale und entfernte Augen-/Mundmimik;
`expressions: false` bleibt wirksam. Noch keine elf separat gezeichneten Emotionen.

45 Python- und 25 Node-Tests bestanden. Echte Cubism-Browsertests: Mund/Blinzeln,
Leerlauf und exakte Geometrie-Rückstellung, Zoom/Sitzung/Speicherung sowie
stummer Raum-Audiotest mit Mimik und sofortigem Mundschluss bei Stop.
Live-HA lädt Profil und 42 Parameter. Frontend- und Dashboard-Backup:
`/home/dreimer/shares/music/Luna/backups/20261028-v9/`.
Wichtig beim Deployment: vorhandene `luna-avatar-card.js.gz` ebenfalls erneuern;
sonst liefert HA Browsern trotz neuer JS-Datei noch alten Code aus.

Offen für spätere Arbeit: extreme Armkombinationen/Winken, ausgeprägtere Mimik
und perspektivische Kopfbewegungen. Ein echter Sprachtest an den Raummikrofonen
und auf dem Zieltablet ist weiterhin nötig; synthetische Tests ersetzen ihn nicht.
Frühere Lichtschaltprobleme wurden in diesem Avatar-Schritt nicht erneut geprüft.

## V8: alle letzten Armänderungen zusammen, 28.10.2026

Gemeinsames Modell: `/home/dreimer/shares/music/Luna/arm-finish-20261028/luna-body-v8-arms.cmo3`.
Ein Paket: `/home/dreimer/shares/music/Luna/Luna-Arme-V8-2026-10-28.zip`.
Enthält V6-Schulterkorrekturen, beide Unterarmüberlappungen und bereinigtes
Hoodie-Body-Mesh (lose Manschettenreste entfernt). Rechte Textur auf bestehendes
ArtMesh6 gemappt, ohne zusätzliche statische ArtMeshes. Überstehende rechte Kappe
nach Kombitest gekürzt. Speichern 19:59:05 mit Verify after save: SUCCESS bestätigt.
Testbilder, PNG/PSD-Quellen, SHA256SUMS und genaue Grenzen in STATUS.md im Paket.

Noch sichtbare Nähte/kleine Spalten und unnatürliche Ärmelkonturen in Extremposen,
besonders rechts; kein vollständig fertiges Rig. Hand-/Arm-Y-/Körperkombinationen
nicht vollständig geprüft. Kein Runtime-Export, HA unverändert. Die folgenden
V6/V7-Abschnitte sind historische Zwischenstände. Bei GUI-Eingaben einzelne
Tastenaktionen getrennt senden und Parameterwert im Screenshot prüfen; gebündelte
Eingaben wurden vereinzelt nicht übernommen.


## V7: linke Ellbogenüberlappung, 28.10.2026

Privat unter `/home/dreimer/shares/music/Luna/elbow-overlap-20261028/`:
`luna-mao-body-v7-elbow-test.cmo3`, transparente `forearm-L-overlap.png`,
`luna-body-elbow-L.psd`, Testbilder und detaillierte `STATUS.md`.
Die neue Textur ist ArtMesh1 zugeordnet, dessen oberes Mesh wurde erweitert.
Zusätzlich beim Reimport entstandenen statischen Unterarm gelöscht.
Ellbogen -30/+30 bei neutraler Schulter und Schulter/Ellbogen -30/-30 sowie
+30/+30 visuell geprüft: Überlappung verdeckt die Ellbogenlücke. Naht und
Torso-Stoffrest bleiben; rechte Seite noch ohne zusätzliche Überlappung.
Nach Rückstellen auf Neutralpose gespeichert; V6 unverändert, kein Runtime-Export.

Korrektur zur vermuteten Blockade: kein bestätigter Hänger. Der Nutzer erkannte
einen übersehenen Discard-Changes-Dialog. Danach zeigte eine Gesamtbildaufnahme
`Mesh is opened`; fehlende Randverbindung geschlossen, Auto connect, bestätigt.
Aktive-Fenster-Screenshots erfassten diese Dialoge nicht. Bei ausbleibender Reaktion
zuerst Gesamtbild prüfen. Alte 19:15-Autosicherung nur historischer Zwischenstand.

## Heimstand 28.10.2026: Schulter-Keyforms in V6 abgeglichen

Neuer privater Arbeitsstand:
`/home/dreimer/shares/music/Luna/shoulder-repair-20261028/luna-mao-body-v6-shoulder-working.cmo3`.
Gespeichert und auf Platte bestätigt (1.742.107 Bytes); Testbilder und SHA256 liegen
daneben. Das mitgebrachte Komplettpaket/V5 wurde nicht verändert. Zusätzlich liegt
`luna-mao-body-v6-left-checkpoint.cmo3` als Zwischenstand nur der linken Korrektur vor.

Ergebnis: Das starke Auseinanderfliegen der Armteile ist in den geprüften
Schulter-/Ellbogenstellungen beider Seiten beseitigt. Noch KEIN fertiges Rig:
Gelenkspalten, Stoffreste und unnatürliche Übergänge bleiben sichtbar. Die
Wrist-/Hand-/Arm-Y-Varianten und Körperparameter sind noch nicht durchgeprüft.
Kein Runtime-Export, keine Änderung am HA-Avatar.

Vorgehen im Cubism-PRO-Trial unter Wine:

- Linke Schulter (`Rotation18`): korrigierte Neutralposition aus V5 übernommen.
  Nur den Eltern-Deformer an die Anschläge zu kopieren reichte NICHT aus.
- Ganze linke Armkette ausgewählt: drei Rotations-Deformer und drei ArtMeshes.
  Form bei exakt Schulter=0/Ellbogen=0 kopiert. Bei Rotation-Deformern ausschließlich
  `Vertices Info` mit Paste Form Special übertragen, Winkel/Skalierung abgewählt.
  Der Optionsdialog muss während des Einfügens geöffnet bleiben.
- Zunächst Schulter -30/+30 bei Ellbogen 0 abgeglichen. Kombitest -30/-30 zeigte
  noch die alte Oberarm-Geometrie. Deshalb auch die sechs Kombinationen aus
  Schulter {-30,0,30} und Ellbogen {-30,30} mit der neutralen Form abgeglichen.
  Damit werden alte Formkorrekturen ersetzt; anatomische Formgebung muss später
  gezielt neu aufgebaut werden. Rotationswinkel bleiben erhalten.
- Rechte Schulter (`Rotation14`): bei Neutralstellung mit Strg+Ziehen den Pivot
  zum Schulteransatz verschoben, Kinder dabei optisch unverändert. Danach ganze
  rechte Armkette einschließlich `Arm R B Warp` kopiert und analog die acht
  nichtneutralen Schulter-/Ellbogenkombinationen abgeglichen. Arm-Y blieb 0.
- Endstellungen und eine gemischte Zwischenstellung (-15/+15) beider Seiten
  angesehen; nach Abschluss Schulter und Ellbogen beidseitig wieder auf 0.

Nächster sinnvoller Schritt: Gelenküberlappungen/Ärmelmaterial und konkrete
Ellbogen-/Handgelenkformen korrigieren, dann die übrigen Parameterkombinationen
prüfen. Nicht erneut blind die Eltern-Deformer verschieben. Bilder im privaten
Arbeitsordner zeigen sowohl den fehlgeschlagenen Kombitest als auch die Korrektur.
Der untenstehende Transportstand beschreibt weiterhin die unveränderte V5.

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
