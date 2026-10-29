# Intakter Mao-Arm mit Luna-Material — 29.10.2026

Verbindliche Arbeitsrichtung: Originalbewegung erhalten, Luna-Grafik anpassen.
Abweichungen benötigen eine begründete ausdrückliche Nutzerfreigabe.

## Erreichter Stand

Private Quelle: `intact-mao-arm-20261029/` unter dem privaten Luna-Verzeichnis.
`luna-left-arm-intact.cmo3` enthält die separat übernommene linke B-Arm-Kette.
`luna-intact-arm-integration.cmo3` enthält diese Kette in einer V9-Kopie.
Runtime-Export: `integration-aligned-export/`.
Vorschau: https://ha.dreimer.de/local/luna/intact-arm-20261029.html
Die normale HA-Karte wurde nicht umgestellt.

Original: `Luna-Komplett-2026-10-28/Cubism/Mao-test/original/mao_pro_t06.cmo3`.
Originale und alte Luna-Versionen bleiben erhalten. Mao © Live2D Inc.; private
Originale, abgeleitete Modelle und Texturen werden nicht ins Git aufgenommen.

Die vollständige B-Kette wurde über Auswahl einschließlich Kindern kopiert:
Armposition, Schulter, Ellbogen, Handgelenk, Zeigefinger und vier ArtMeshes.
IDs im Export: ArtMesh149–152. Keine Neutralformen über vorhandene Keyforms
kopiert, keine inneren Pivotkorrekturen, keine zusätzliche Browser-Verformung.
Die äußere Positionierung wurde einheitlich skaliert/verschoben und in der
Luna-Kopie unter `Shoulder L [Core]` eingehängt. Die ursprüngliche linke
Luna-B-Part wurde ausgeblendet; Export lässt versteckte Parts weg.

Das Originalmaterial wurde als Atlas exportiert. Ein einziger imagegen-Aufruf
hat die zwei Ärmelteile mit Lunas cremefarbenem Strickmaterial versehen.
Referenzen: `arm-atlas-crop.png` und die freigegebene Luna-Hüftreferenz.
Rohresultat: `luna-arm-material-generated.png`; technische Größenanpassung auf
1200×2096, Beschneidung auf die vorhandene Ärmel-Alphaform und Einsetzen bei
Atlasposition 2450/2000. Hand und separater Finger wurden aus dem Originalatlas
unverändert übernommen. Der Atlas wurde im Editor ersetzt und auf das Modellbild
angewandt. Diese Änderungen betreffen das Material, nicht die Gelenkformen.

## Nachweis und Grenzen

`node tools/live2d/intact-arm-audit.mjs --integrated` vergleicht 625 Kombinationen
der vier Arm-/Handparameter mit dem unveränderten SDK-Mao. Einmalig an der
Neutralhaltung bestimmte einheitliche Skalierung und Verschiebung werden für
alle Kombinationen festgehalten. So würde ein erneutes Ersetzen der Keyforms
durch eine Neutralform den Test nicht bestehen.

Integration: maximale Abweichung 0,014 Quellpixel (aufgerundet), keine
Browserfehler. Die 28 verbleibenden V9-ArtMeshes sind in Neutralstellung
geometrisch exakt unverändert. Nur ArtMesh0/1/2 wurden durch ArtMesh149–152
ersetzt. Bilder und checks.json liegen im privaten Ordner sowie lokal in
`tools/live2d/dist/intact-integration-check/`.

Das bestätigt die erhaltene native Bewegung innerhalb dieser B-Arm-Variante.
Es ist KEIN Nachweis für einen fertigen gesamten Körper, perfekte Stoffnähte,
alle Körperkombinationen oder einen Übergang vom gesenkten zum gehobenen Arm.
Die Vorlage verwendet getrennte A/B-Armvarianten. Die offene Winkhand fehlt;
die übernommene Hand ist gekrümmt mit separatem beweglichem Zeigefinger.

## Nächster Schritt innerhalb der Freigabe

Die A/B-Prüfung unten ist abgeschlossen. Vor weiterer Übernahme die fehlende
Winkhand und die akzeptable Übergangsqualität klären. Schulteranschluss und Stoffdarstellung weiter
visuell prüfen, anschließend Körper-/Atemkombinationen. Die rechte Seite und
weitere Posen folgen erst nach dieser Armprüfung. Keine Rückkehr zum alten
Einzelreparatur- oder Browser-Verformungsweg.

## Ergebnis der Original-Posenprüfung

`tests/mao-arm-variants.html` zeigt das unveränderte SDK-Mao mit den nativen
A/B-Parametern und einem separat nachvollziehbaren Sichtbarkeitswechsel.
`node tools/live2d/mao-variants-audit.mjs` prüft diese Diagnose, erzeugt Bilder
der A-Parameterenden und sammelt die Sichtbarkeitskurven aller acht Originalmotions.
Browserprüfung bestanden: keine Fehler, Varianten verschieden, A nach A→B→A
pixelgenau wiederhergestellt. Artefakte: `dist/mao-variants-check/`.

**Grenze der Vorlage:** A und B sind getrennte Zeichnungen. Die Originalmotions
halten die jeweilige Arm-Sichtbarkeit konstant; sie enthalten keine durchgehende
geometrische Hebebewegung zwischen den Varianten. `Mao.pose3.json` gruppiert
PartArmLA/LB. SDK `Framework/src/effect/cubismpose.ts`, `doFade`, ändert nur
die Deckkraft; Standardzeit 0,5 Sekunden. Die Diagnose bildet diese Deckkraftregel
nach, ohne Vertexkorrekturen. Die getrennten Haltungen sind kein vollständiges
natürliches Armheben. Das zusätzliche Übernehmen der A-Kette allein löst das nicht.

Hiyori wurde separat im unveränderten Runtime-Modell betrachtet: Die geprüfte
B-Haltung zeigt gekrümmte Hände an den Haaren. Das ist kein Nachweis einer offenen
Winkhand oder einer kompatiblen Ersatzkette. Bearbeitbare Hiyori-Quelldaten wurden
im privaten Luna-Verzeichnis bei der gezielten Dateisuche nicht gefunden.

Zusätzlicher Kandidat, noch NICHT übernommen oder technisch qualifiziert:
https://www.live2d.com/en/learn/sample/chitose/
Die offizielle Beschreibung nennt Winken durch Wechsel des rechten Arms und
bearbeitbare CMO3-Daten. Ein nahtloses Armheben ist damit weiterhin nicht belegt.
Vor Erweiterung der bisher besprochenen Vorlagenauswahl ausdrückliche Freigabe
einholen. Keine automatische Rückkehr zu selbst konstruierten Bewegungsformen.
Lunas CMO3, HA-Modell und Produktionsruntime wurden bei dieser Prüfung nicht verändert.

## Reproduktion und Editorhinweise

`tests/intact-arm-study.html` zeigt den isolierten Arm; `?integrated` die Luna-Kopie.
Privates SDK-Mao nach `dist/Mao`, isolierter Export nach `dist/IntactArm`,
integrierter Export nach `dist/IntactIntegration`, alter V9-Export nach `dist/LunaV9`.
`node tools/live2d/native-arm-server.mjs` stellt die Dateien lokal auf Port 8792 bereit.

Die isolierte Kopie hat nach der Canvas-Anpassung eine feste Verschiebung gegenüber
Mao; der Test berücksichtigt genau diese konstante Verschiebung. Bei der
Integration wurde der äußere Positionierungs-Deformer auf 18 Prozent gesetzt;
nach Einhängen unter die vorhandene Schulter zeigt der Inspector ungefähr
102 Prozent an, da deren übergeordnete Skalierung bereits wirkt.

Wine-GUI: Nach Tabwechseln tatsächlich den aktiven Modellnamen prüfen und vor
Textänderungen das fokussierte Feld kontrollieren. Eingaben mit nur 100 ms Abstand
führten gelegentlich zu Aktionen im falschen Bereich. Nicht blind wiederholen.
Beim Speichern unbenutzte Quellbilder behalten (Tab von Yes nach No, Leertaste).

Offizielle Beschreibung der verwendeten vollständigen Objektübernahme:
https://docs.live2d.com/en/cubism-editor-manual/copy-and-paste/
Texturersatz ohne Änderung des Rigs:
https://docs.live2d.com/en/cubism-editor-manual/png-file-export-replacement/
