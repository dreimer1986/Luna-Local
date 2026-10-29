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

Die gesenkte A-Variante und deren ursprüngliche Umschaltung/Übergänge prüfen,
danach passend übernehmen. Schulteranschluss und Stoffdarstellung weiter
visuell prüfen, anschließend Körper-/Atemkombinationen. Die rechte Seite und
weitere Posen folgen erst nach dieser Armprüfung. Keine Rückkehr zum alten
Einzelreparatur- oder Browser-Verformungsweg.

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
