# Schwanz: Spenderprüfung, 30.10.2026

Gewünscht: buschiger Ragdoll-Schwanz entsprechend der freigegebenen Bildvorschau,
bewegt, auf beiden Körperseiten sichtbar, kontinuierlicher Seitenwechsel hinter
dem Körper. Rechte Bildseite als bevorzugte Ruheposition. Ansatz verdeckt hinter
Hüfte/Kleidung. Einseitiges Pendeln erfüllt die Anforderung nicht.

## Geprüfter Stand

- Die lokalen Mao-/Chitose-Parameterverzeichnisse enthalten keinen Schwanz.
- Offizieller zusätzlicher Kandidat: [Tororo & Hijiki](https://www.live2d.com/en/learn/sample/tororo-hijiki/), © Live2D Inc.
- Originaldownload mit CMO3 und Runtime privat gespeichert unter
  `/home/dreimer/shares/music/Luna/tail-study-20261030/donor/`.
  `provenance.json` enthält Herkunft und SHA256 des unveränderten ZIPs.
- Tororo besitzt `PARAM_TAIL` und `PARAM_TAIL_ANGRY`, jeweils 0..1.
- Cubism-Core-Vergleich: `PARAM_TAIL` verändert `D_TAIL_03` und `D_TAIL_00`.
  Gerenderte Endpunkte zeigen den Schwanz auf der linken Bildseite, einmal
  abgesenkt und einmal angehoben. Das ist kein Seitenwechsel.
- Zusätzliche Ansichten von `PARAM_TAIL_ANGRY` 0, .25, .5, .75, 1 bei
  `PARAM_TAIL=0` wurden erzeugt. Die geprüften Endpunkte zeigen ebenfalls
  keinen Seitenwechsel. Keine Behauptung über sämtliche Parameterkombinationen.
- Audit, JSON und ausgewählte Screenshots liegen im privaten Studienordner.
  `tail-donor-30.png` verwendet einen Eingabewert oberhalb des Bereichs;
  die Runtime begrenzt diesen auf den oberen Endpunkt. Der Core-Audit benutzt
  direkt die tatsächlichen Grenzen 0 und 1.

## Konkreter Vorschlag zur Freigabe

Die intakte Schwanzkette als Spender übernehmen und das Fellmaterial an Luna
anpassen. Für den Seitenwechsel einen zusätzlichen nativen
Cubism-Parameter vorsehen: Schwanz bewegt sich hinter die Körpermitte, wird dort
verdeckt und kommt auf der Gegenseite wieder hervor. Die sichtbare Form muss
dabei geprüft werden; eine bloße Spiegelumschaltung reicht nicht.

Diese zusätzliche Seitenbewegung ist im geprüften Spender nicht vorhanden.
Der Nutzer hat die gezielte Ergänzung am 30.10.2026 ausdrücklich mit
„Ja, ist freigegeben“ genehmigt. Keine Änderungen an Armen, Gesicht oder
bestehenden Gelenken. Keine prozedurale Vertex-Verformung im Browser.

Nach Freigabe zuerst isolierte native Vorschau mit Luna: links, Mitte verdeckt,
rechts und langsamer vollständiger Übergang. Erst nach visueller Prüfung Einbau
in den laufenden Avatar; dann Leerlaufansteuerung und später Stimmung.

## Umsetzung und Prüfung (30.10.2026)

- Arbeitskopie `C:\LunaNative\luna-tail-study-20261030.cmo3`, zusätzlich privat
  im Studienordner gesichert. Originalmodell und produktives HA unverändert.
- Tororo-Kette `B_TAIL_01 > B_TAIL_02` samt beiden Schwanzmeshes übernommen.
  Zusätzlicher Placement-Deformer und nativer Warp `Luna Tail Side` direkt über
  den beiden Meshes. `ParamLunaTailSide`: -1 links, 0 hinter dem Körper, +1 rechts.
  Kein browserseitiger Eingriff in Vertexdaten.
- Draw Order für alle 15 Schwanz-Keyforms auf 0 gesetzt, per Cubism
  [Multiple Keys Editing](https://docs.live2d.com/en/cubism-editor-manual/multi-key/).
  Die erste Änderung nur am Ruhe-Keyframe hatte beim Bewegen den Ansatz vor die
  Hose gebracht; das ist im aktuellen Export korrigiert.
- Core-Audit: 40 ursprüngliche Meshes bei Defaultparametern geometrisch
  unverändert, insgesamt jetzt 42. 60 Kombinationen (5 Seitenwerte × 4 Liftwerte
  × 3 Angrywerte): endliche Koordinaten, beide Schwanzmeshes stets Draw Order 0.
  Dies ist kein Beleg für sämtliche Gesichtsausdrücke oder Armposen.
- Ragdoll-Fellzeichnung per Imagegen erzeugt, eigener Atlas 04. Original 2048²,
  generierter Atlas 1254²; normalisierte UVs bleiben gleich. Sichtprüfung an
  gerendertem Modell durchgeführt. Das enge Spender-Mesh begrenzt die Fellkontur.
- CMO3 enthält weiterhin die weiße Spendertextur. Der Export braucht deshalb
  **beide** reproduzierbaren Nachschritte: `restore-portrait-atlas.mjs` und
  `restore-tail-atlas.mjs`. Beide verweigern unbekannte Ausgangstexturen per Hash.
- Vorschau: `http://127.0.0.1:8792/tests/luna-tail-study.html`, lokale Runtime in
  `tools/live2d/dist/TailLuna`. Start rechts; Links/Mitte/Rechts wechseln in 2,2 s.
  Ruhiger Leerlauf benutzt PARAM_TAIL 0..0.08. Spenderbewegung separat prüfbar.
  Ansicht auf 90 % verkleinert, damit die seitliche Ausladung sichtbar bleibt.
- Reproduzierbarer Core-Test: `node tools/live2d/tail-native-check.mjs` bei
  laufendem `native-arm-server.mjs`; benötigt private TailLuna- und Baseline-Dateien.
  Ergebnisse unter `tools/live2d/dist/tail-integrated-audit.json` und privat.

## Noch offen / bewusst nicht als fertig bezeichnet

Der große Spenderhub ergibt rechts eine andere Kurve als links. Der geringe
Leerlaufhub ist sichtbar geprüft; der komplette Bereich bleibt eine Studien-
steuerung. Vor produktiver Umstellung müssen Größe/Bildausschnitt und Bewegung
im tatsächlichen HA-Layout geprüft und die Leerlaufansteuerung eingebunden werden.
Die native CMO3-Vorschau verwendet noch das weiße Material; die dokumentierten
Exportnachschritte liefern das Ragdoll-Fell und das freigegebene Gesicht.
Kleidungsauswahl ist mit dieser Schwanzstudie noch nicht umgesetzt.

## Private Artefakte

`/home/dreimer/shares/music/Luna/tail-study-20261030/` enthält CMO3-Kopie,
`preview-export/`, `materials/ragdoll-tail-atlas.png` und Audit-JSON.
Spenderquellen, Cubism Core und generierte Texturen werden nicht ins Git aufgenommen.

Die isolierte Vorschau ist zusätzlich unter
`https://ha.dreimer.de/local/luna/tail-study-20261030/index.html` bereitgestellt.
Sie hat einen eigenen Modell-/Runtimeordner. Produktive Lovelace-Konfiguration
und Modellpfade wurden nicht umgestellt. Browserprüfung: links/rechts/Mitte,
exakte Rückkehr und veränderliche Leerlaufbilder; keine Browser-/HTTP-Fehler.

### Längere Fellsträhnen (30.10.2026)

Nach Nutzerreferenz aus Downloads langhaarige Textur erzeugt und nach expliziter
Freigabe mit ImageMagick in die bestehende Atlasfläche eingepasst. Keine Änderung
an Meshes, Gelenken, UVs oder Schwanzbreite. Private Quellen:
`materials/ragdoll-tail-long-fur-unregistered.png`, Ergebnis
`materials/ragdoll-tail-atlas-v2.png`; `ragdoll-tail-atlas.png` zeigt auf diesen Stand
(identische Dateikopie). V1 bleibt als Rückfallkopie erhalten.

Reproduktion im privaten materials-Verzeichnis:
```sh
magick ragdoll-tail-long-fur-unregistered.png -crop 766x263+241+675 +repage -resize '588x182!' -background none -gravity northwest -splice 264x665 -extent 1254x1254 ragdoll-tail-atlas-v2.png
```

Der erste technische Versuch hatte durch falsche Gravity eine versetzte Textur;
der Browsertest erkannte den unsichtbaren Schwanz. Vor Veröffentlichung korrigiert.
Der korrekt eingepasste Stand besteht den Bewegungs-/Rückkehrtest und wurde
links/rechts visuell geprüft. HA-Studienvorschau verwendet nun V2; produktive
Luna-Kachel weiterhin unverändert. Die längeren Haarsträhnen sind sichtbar,
zusätzliches Fellvolumen außerhalb der bisherigen Meshkontur ist nicht enthalten.

### Offener Konturauftrag / Eingabeblockade am Nachmittag

Nutzer will echte längere Außenhaare/buschigere Kontur, nicht nur V2-Strähnen.
Erweiterung ausschließlich im nativen Schwanzmodell ausdrücklich beauftragt.
Noch NICHT durchgeführt. Sicherung vor Änderung:
`tail-study-20261030/before-fur-volume.cmo3`.
Nach Monitorwechsel und Editorhängern neu gestartet und Arbeitskopie geöffnet.
KDE fragt wiederholt nach Python-Eingabefreigabe. Auch dauerhaft offener
XTest-Prozess reagiert nach Freigabe zuletzt nicht: angeforderte Mausposition
2348,37, KWin meldet unverändert 2344,195. Keine weiteren blinden Modelländerungen.
Vor Wiederaufnahme nach Desktop-Neustart Eingabe mit sichtbarem Menü verifizieren.
Produktive Kachel sowie HA-Schwanzvorschau weiterhin unverändert auf V2-Textur
und dünner bisheriger Kontur. Keine Verbreiterung als erledigt melden.

### Konturverbreiterung umgesetzt nach Neustart (30.10., 15:54)

Die vorstehende Eingabeblockade ist behoben. Mit dauerhaft offenem XTest-Prozess
und einmaliger KDE-Freigabe sind Maus, Menüs und Tastatureingaben wieder geprüft.
Native Konturänderung jetzt tatsächlich umgesetzt:

- Statischer Warp `Luna Tail Fur Volume` (ID `Warp3`) als Kind von `Luna Tail Side`,
  direkt über **beiden** Schwanzmeshes. Bestehende Spenderparameter unverändert.
- Vertikaler Umfang gegenüber vorher an beiden Seiten gemessen Faktor 1,69935;
  horizontaler Umfang unverändert (Abweichung < 0,000001 relativ).
- V2-Textur byteidentisch beibehalten, SHA256
  `ba29080beb6836c81f3c0442216bea124069ad0c77fd4b69e035c02df92744e8`.
  Dadurch ragt die Fellkontur nun tatsächlich über die vorherige Silhouette hinaus.
  Es ist eine native Volumenvergrößerung, keine separat simulierten Einzelhaare.
- 40 ursprüngliche Meshes im Defaultvergleich unverändert; 60 Schwanzkombinationen
  mit endlichen Koordinaten und Draw Order 0 bestanden. Browser: links, rechts,
  verdeckte Mitte, exakte Rückkehr und bewegter Leerlauf bestanden. Sichtkontrolle
  beider Seiten und der verdeckten Mitte durchgeführt.
- CMO3 gespeichert und privat gesichert; neuer Roh-Export unter
  `C:\LunaNative\tail-fur-volume-export\`. Beide Atlas-Restore-Schritte bleiben nötig.
- HA-Studienvorschau und privater `preview-export` verwenden den neuen MOC3.
  Produktive Luna-Kachel weiterhin nicht umgestellt. Rückfallkopien:
  `before-fur-volume.cmo3` und `before-fur-volume.moc3` im Studienordner.

### Rundere Spitze und feiner Fellrand (30.10., 16:40)

V3-Fellatlas mit gerundeter Spitze und auslaufenden Haaren erstellt. Native
Geometrie und Parameter bleiben auf dem geprüften Warp3-Stand. Der erste
174px hohe Atlasversuch wurde an der Spitze vom vorhandenen UV-Mesh beschnitten;
finale technische Einpassung des generierten `ragdoll-tail-rounded-source.png`:

```sh
magick ragdoll-tail-rounded-source.png -crop 594x212+265+642 +repage \
 -resize '574x150!' -background none -gravity northwest \
 -splice 273x674 -extent 1254x1254 ragdoll-tail-atlas-v3.png
```

V3 SHA256: `d1b211094c3d56712261b7d89f41298620dfd48c138392b4436752e4e14348da`.
Die Einpassung nimmt etwas vertikales Texturvolumen zurück, damit die runde
Spitze innerhalb der UV-Fläche liegt. Beide Seiten im Render geprüft. V2 und
`before-round-tip.png` bleiben privat als Vergleich erhalten. Atlas-Restore
akzeptiert bisherige V1/V2 und stellt jetzt V3 her. Nur Studienvorschau aktualisiert.

### Unterkante abgestuft (30.10.)

V4: Imagegen-Unterkantenvariante technisch in die UV-Untergrenze eingepasst,
mit 5 Atlaspixeln Abstand. Oberhalb des schmalen unteren Übergangs wird V3
unverändert übernommen, unten 8 Pixel Überblendung zur eingepassten Variante.
So werden die Haarspitzen nicht länger von der Modellkante glatt abgeschnitten.
Native Geometrie unverändert. Lokale Sichtprüfung links/rechts und Bewegungstest
bestanden. Material, Prompt und reproduzierbares ImageMagick-Fitting privat im
materials-Ordner. SHA256: `3ecf0d110be0bdb4c7a14145d47cf6896294e99d60e1ded1b5157db3f248c347`.

### Produktiv freigegeben und verteilt (30.10.2026)

Die oben beschriebene ausstehende Umstellung ist jetzt abgeschlossen. V4 wurde
vom Nutzer visuell abgenommen. Hauptdashboard und Luna-Vollbild wurden über
HA-WebSocket auf folgende neue lokale Dateien umgestellt und zurückgelesen:

- `/local/luna/model-native-tail-20261030/luna.model3.json`
- `/local/luna/runtime-native-tail-20261030/runtime.mjs`

`native-avatar.mjs` steuert nur vorhandene native Parameter: 20 Sekunden rechts,
4 Sekunden Übergang, 20 Sekunden links, 4 Sekunden zurück. Geringer Hub 0..0.08,
keine Angry-Verformung im Leerlauf. Reduced Motion hält rechts ohne Bewegung.
Explizite Parameter überschreiben den Leerlauf. Keine Vertexmanipulation.
Automatische Popups übernehmen die Kartenkonfiguration; geöffnete Clients einmal
neu laden. Kein HA-Neustart nötig. Kleidungsauswahl bleibt eine separate Aufgabe.

Prüfungen: native Steuerungstests, 60 Core-Kombinationen ohne Änderungen an den
40 Originalmeshes; alle bisherigen vier Atlanten bytegleich. Live-Browsertest
`tail-release-check.mjs`: Mund, Blinzeln, Winkarm, exakte Rückkehr, bewegter
Leerlauf, Seitenwechsel und freie Ränder in Ganzkörperansicht bestanden.

Das eigene freigegebene V4-Fell liegt jetzt in Git unter `docs/live2d/tail/`;
die frühere Aussage, sämtliche generierten Texturen blieben privat, gilt hierfür
nicht mehr. Native Spender-/Modellquellen und Cubism Runtime bleiben wie bisher
privat. Vollständiger Vorschauexport ist unter `preview-export/` gesichert.
Dashboard-Rückfallkopien: `tail-study-20261030/deployment-backup/dashboard-{1,2}.json`.
Die alten HA-Modell-/Runtime-Verzeichnisse bleiben unverändert verfügbar.
