# Luna: Live2D-Arbeitsstand

Live2D Cubism ist die gewählte Zieltechnik. **Es gibt noch kein fertig geriggtes
Luna-Modell und keinen Live2D-Player in der HA-Kachel.** Ein lokaler SDK-Adapter
rendert inzwischen ein offizielles Beispielmodell im Browser; die
[Build- und Testanleitung](../../tools/live2d/README.md) beschreibt den Stand.
`source/luna-reference-only.cmo3` ist ein echtes Cubism-Editor-Projekt mit dem
Original als Zeichenreferenz, ausdrücklich noch kein animierbares Luna-Rig. Die
freigegebene Illustration bleibt deshalb die Standarddarstellung. Das bisherige
SVG-Rig und der Versuch mit verformten PNGs sind kein Ersatz für das Cubism-Modell.

## Verbindliche Vorlage

- [Freigegebene Luna](../branding/luna-waist-reference.png): Identität, Proportionen,
  tiefblaue Augen, Ragdoll-Ohren, Colourpoint-Haarspitzen und cremefarbener Pullover.
- [Lachen](references/laughing.png) und [Ärger](references/angry.png) sind
  **Ausdrucksreferenzen**, keine fertig getrennten Modell-Ebenen.
- Hüftansicht; vollständig bekleidet, altersgerecht und durchgehend Safe for Work.
- [rig-contract.json](rig-contract.json) legt Ebenen, Parameter und Lieferdateien fest.
  Es handelt sich um eine Produktionsvorgabe, nicht um ein ladbares `model3.json`.

## Zeichnung und Rig vorbereiten

1. Die Originalzeichnung als gesperrte Referenz in eine PSD aufnehmen. Bewegliche
   Teile auf eigene Ebenen legen und die verdeckten Bereiche ergänzen. Keine
   nackte Körperbasis erstellen: Hals, Hände und eine geschlossene, bekleidete
   Rumpfbasis genügen für dieses Modell.
2. Auge links/rechts jeweils in Weiß, Iris/Pupille, Lichtreflex und obere/untere
   Lider aufteilen. Den Augapfel unter den Lidern vollständig ergänzen. Brauen,
   Gesicht, Ohren und Haarsträhnen getrennt bearbeiten.
3. Mundinnenraum, Zunge, obere Zähne und Lippen getrennt vorbereiten. A/I/U/E/O,
   geschlossener Mund und Lächeln brauchen korrekt kombinierbare Formen.
4. Den Pullover in Rumpf, Kragen und Ärmel aufteilen. Oberarm, Unterarm und Hände
   getrennt riggen. Kleidung unter denselben Körper-Deformern wie die jeweilige
   Bewegung führen. Neue Outfits brauchen eigene angepasste Meshes: ein PNG-Tausch
   allein erhält weder Faltenwurf noch Gelenke korrekt.
5. Im Cubism Editor zuerst Gesicht und Kopfbewegung erstellen, dann Schultern,
   Gesten, Atmung und dezente Haar-/Ohrenphysik. Normale Blinks müssen auch bei
   Kopfneigung, Lachen und Ärger ohne doppelte Wimpern funktionieren.
6. Gefühl über eigene kontinuierliche Parameter steuern. Mundöffnung und
   Lautform bleiben unabhängig vom Gefühl; Lachen darf Lippen-Synchronisation
   nicht ständig überschreiben. Stille und Unterbrechung schließen den Sprechmund.
7. MotionSync mit der tatsächlichen deutschen TTS-Stimme abstimmen. Eine
   Lautstärkeanzeige ist keine ausreichend genaue Lippen-Synchronisation.
8. Editor-Projekt, geschichtete PSD, Modell und Begleitdateien gemeinsam sichern.
   Nur die exportierten Laufzeitdateien gehören später auf den HA-Server.

## Browser und Kleidung

Die vorhandene `LunaSession` bleibt Eigentümerin von Mikrofon, Assist-Aufruf und
Audio-Wiedergabe. Ein Cubism-Renderer erhält ausschließlich Darstellungszustand
und das tatsächlich abgespielte Audio. Kachel und Popup verschieben denselben
Renderer; es entsteht keine zweite Sprachsitzung.

Rendern erfolgt zeitbasiert per `requestAnimationFrame`, Ziel 60 FPS auf dem
Zielgerät. Cubism berechnet die Zwischenzustände des Rigs. Mehr Frames reparieren
kein fehlerhaftes Mesh. Bei unsichtbarer Ansicht pausiert die Darstellung;
`prefers-reduced-motion` reduziert freiwillige Körper-/Haarbewegungen.

Outfits sind zunächst **vorgefertigte, geprüfte Varianten derselben Luna** mit
denselben Parametern. Gesprächsmodell und Robotersteuerung dürfen keine beliebigen
Dateien, Skripte oder Outfits nachladen. Hintergründe bleiben außerhalb des Modells.

## Modell-Prüfung

Nach dem Cubism-Export:

```powershell
python tools/validate_live2d_model.py C:\Pfad\zu\luna.model3.json
```

Die Prüfung findet fehlende Dateien, unsichere Verweise, ungültige JSON-Daten,
fehlende Parameter, Ausdrucks- und Bewegungsgruppen sowie falsche Dateisignaturen.
Sie ersetzt **nicht** den Cubism-MOC3-Konsistenzcheck oder die Sichtprüfung.
Eine umbenannte PNG-Datei oder selbst erfundene MOC3-Datei ist kein Modell.

## Abnahme vor Aktivierung in HA

- Original und neutrale Pose nebeneinander vergleichen, auch in großer Ansicht.
- Lachen, Ärger und Verlegenheit bei Intensität 0 / 0,25 / 0,5 / 0,75 / 1 ansehen.
- Jede Pose mit Blinzeln, Kopfneigung und jeder Mundform kombinieren.
- Augen-/Mundränder ohne Doppelkonturen, Hautlöcher oder sichtbare Texturübergänge.
- Zehn deutsche Testsätze einschließlich P/B/M, F/V, O/U, S/Z, Pausen und Zahlen.
- Stopp und neuer Gesprächsbeitrag müssen alte Mund-/Gefühlscues verwerfen.
- Mindestens 30 Sekunden Bewegung auf dem tatsächlichen Browser/Tablet messen;
  keine FPS-Behauptung aus einem alleinigen Desktop-Test ableiten.
- Beide Darstellungen, Tabwechsel, Kontextverlust und fehlende Assets testen.
- Jedes Outfit durch dieselbe Prüfung schicken.

## Voraussetzungen und tatsächlicher Stand (27.10.2026)

Der Nutzer hat den Cubism Editor 5.3.05 beta1 installiert und das Web-SDK 5 R5
einschließlich Core unter `Downloads/Cubism` bereitgestellt. Der frühere
Download-Blocker ist damit erledigt. Der Editor wurde im FREE-Modus gestartet;
kein kostenpflichtiger Vertrag und keine Testlizenz wurden aktiviert.

Der lokale Adapter lädt echte MOC3-Dateien mit Core-Konsistenzprüfung, Texturen,
Bewegungen, Ausdrücke und Physik. Ein Headless-Edge-Test rendert das offizielle
Hiyori-Testmodell mit 70 Parametern; das Ergebnis wurde auch visuell kontrolliert.
Hiyori ist nur eine lokale Testdatei, wird nicht mit Git ausgeliefert und ist
ausdrücklich nicht Luna. Dieser Test beweist keine fertige Lippensynchronisation
oder die optische Qualität eines noch nicht vorhandenen Luna-Rigs.

Offen bleiben die getrennte Zeichnung und das künstlerische Rigging. Die
automatisierte Editorbedienung hat bislang nur das Referenzprojekt erstellt.
Die zugesagte ausdrucksstarke Luna ist damit **nicht fertig**. Für eine verlässlich
hochwertige Umsetzung braucht dieser Schritt gezielte Illustrator-/Rigger-Arbeit.

Für die Ziel-Lippensynchronisation fehlt außerdem das separate
[MotionSync-Paket](https://www.live2d.com/en/sdk/download/motionsync/). Es ist nicht
Bestandteil des bereitgestellten normalen Web-SDKs. SDKs/Core werden nicht
ungeprüft ins öffentliche Repository aufgenommen.

Die Veröffentlichung eines erweiterbaren Avatar-Systems kann nach den
[Live2D-Bedingungen](https://www.live2d.com/en/sdk/license/expandable/) eine gesonderte
Freigabe erfordern. Die Einordnung dieses konkreten Projekts ist noch offen.
Vor Veröffentlichung des integrierten SDKs muss diese geklärt werden; ein rein
lokaler Entwicklertest ist nicht mit einer öffentlichen HACS-Auslieferung gleichzusetzen.

## Offizielle Referenzen

- [Illustration aufteilen](https://docs.live2d.com/en/cubism-editor-tutorials/psd/)
- [Editor-Export](https://docs.live2d.com/en/cubism-editor-manual/export-moc3-motion3-files/)
- [Web-Modell laden](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)
- [MotionSync](https://docs.live2d.com/en/cubism-editor-manual/motion-sync/)
- [Framework-Quellen](https://github.com/Live2D/CubismWebFramework/tree/5-r.5)
