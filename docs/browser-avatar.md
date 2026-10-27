# Luna im Browser – experimentelle Vorschau

## Live2D-Stand 0.4.0b4

`avatar: live2d` ist jetzt verfügbar und wurde mit dem privaten Luna-Modell in HA
gegen echte KI-Antworten und TTS geprüft. Die Illustration bleibt der Standard;
SDK/Core und Modell werden separat lokal bereitgestellt. Beispiel:

```yaml
type: custom:luna-avatar-card
avatar: live2d
presentation: card
continuous: false
background: moon
live2d_runtime: /local/luna/runtime-20261027-hands/runtime.mjs
live2d_model: /local/luna/model-20261027/luna-smile2.model3.json
```

Blinzeln, audioabhängige Mundformen und dezente Leerlaufbewegungen sind vorhanden.
Der Mund hat einen oberen Zahnrand und einen kleinen Eckzahn. Audioanalyse ist
weiterhin eine Näherung; MotionSync und das volle Ausdrucksset sind nicht fertig.
Die bestehenden Einstellungen für STT/TTS und Stimme werden verwendet.
Installations-/Sicherungspfade und Testnachweise: [HANDOFF.md](../HANDOFF.md).

## Historische Einrichtung der Illustrationsvorschau (0.4.0b3)


Lovelace-Kachel und eigenes Popup verwenden dieselbe Sprachsitzung. Beim
Vergrößern läuft das Gespräch weiter; Browser Mod ist nicht nötig.

**Stand:** lokal getesteter Prototyp. Der vollständige Mikrofon–Assist–TTS-Test
in einer laufenden HA-Instanz steht aus. Seit 0.4.0b3 zeigen Kachel und Popup
standardmäßig die unveränderte, freigegebene Luna-Illustration. Dieses Bild hat
noch keine Gesichtsanimation oder Lippensynchronisation. Das dafür benötigte
Ebenen-Rig muss die Qualität und Identität dieser Illustration erhalten.

Als Zielsystem ist jetzt **Live2D Cubism** festgelegt. Die
[Modellvorbereitung und offenen Voraussetzungen](live2d/README.md) sind separat
dokumentiert. Noch keine Live2D-Option in YAML setzen: Modell und Player sind
noch nicht fertig und werden nicht durch einen automatischen PNG-Import ersetzt.

## Einrichten

1. Integration auf **0.4.0b3 oder neuer** aktualisieren und HA neu starten. Die
   Browser-Vorschau muss tatsächlich installiert sein; ein Git-Push auf `master`
   aktualisiert deine HA-Installation nicht automatisch. Solange es dafür kein
   veröffentlichtes Release gibt, in HACS beim erneuten Herunterladen `master`
   wählen, sofern angeboten, oder `custom_components/luna_local` aus diesem Stand
   manuell in HA übernehmen. Der enthaltene Ordner `frontend` muss mitkopiert werden.
2. Eine Assist-Pipeline mit **Luna Lokal**, Spracherkennung und Sprachausgabe
   einrichten. Ihre Stimme und Sprache werden auch im Browser verwendet.
3. Die Integration meldet das Kartenmodul seit 0.4.0b2 **automatisch** im Frontend
   an. Die HA-Seite anschließend vollständig neu laden (`Strg` + `F5`). Es ist
   weder ein Dashboard-Ressourceneintrag noch eine Kopie nach `www` nötig. Einen
   vorher manuell angelegten Luna-Ressourceneintrag kannst du entfernen.
4. Eine manuelle Karte hinzufügen:

```yaml
type: custom:luna-avatar-card
presentation: card  # card oder popup
avatar: illustration  # freigegebenes Originalbild; Standard seit b3
continuous: false  # nach Lunas Antwort automatisch wieder zuhören
background: moon   # moon oder plain
expressions: true  # Mimik-Abfrage; derzeit nur im technischen SVG-Modus verwendet
# pipeline: 01...  # Assist-Pipeline-ID bei mehreren passenden Pipelines
```

Ohne `pipeline` wird die bevorzugte Luna-Pipeline verwendet, sonst die einzige
passende. Die Entity Registry identifiziert Luna auch nach einer Umbenennung.
Mehrdeutige oder unpassende Einstellungen erzeugen eine Fehlermeldung.

`popup` zeigt zunächst „Luna öffnen“. Die Kachel bietet „Vergrößern“. Schließen
kehrt zur Kachel zurück; im reinen Popup-Modus stoppt das Gespräch dabei.

Das Mikrofon benötigt HTTPS oder localhost und die Browser-Freigabe. „Sprechen“
startet einen Beitrag; Assist erkennt dessen Ende oder „Fertig“ beendet ihn.
„Stopp“ beendet Aufnahme, Wiedergabe und Gesprächsautomatik. Während einer Antwort
kann „Unterbrechen & sprechen“ einen neuen Beitrag starten. „Ton aus“ schaltet nur
die Wiedergabe stumm. Tabwechsel, Navigation und Verbindungsabbruch stoppen die
Sitzung; Zurückkehren startet das Mikrofon nicht automatisch.

Das Transkript bleibt im Browser-Arbeitsspeicher; die vorhandene Luna-Gedächtnislogik
verarbeitet Beiträge weiterhin wie bei anderen Assist-Dialogen. Es gibt keine
globale Übertragung an andere Browser. Mehrere Karten/Tabs haben eigene Sitzungen.

## Darstellung und Grenzen

Die Standardansicht zeigt das freigegebene Originalbild bis zur Hüfte. Es wird
unverändert mit HACS ausgeliefert; Gesicht und Zeichenstil werden nicht durch
programmatisch gezeichnete Formen ersetzt. Der vorhandene transparente Hintergrund
lässt sich mit `moon` oder `plain` hinterlegen. Gespräche, Mikrofon, Sprachausgabe und Popup funktionieren
unabhängig davon. Eine Animation dieser Illustration ist noch nicht enthalten.

Nur mit `avatar: technical` wird das bisherige vereinfachte SVG-Test-Rig angezeigt.
Es zeigt Luna bis zur Hüfte mit geschlossenem cremefarbenem Pullover,
Ragdoll-Ohren und blauen Augen. Blinzeln, Kopfneigung, leichtes Atmen, Erröten und
mehrere Mundformen sind vorhanden. Neun Gesichtsausdrücke gehen weich ineinander
über, einschließlich Augen-, Brauen- und Ohrstellungen. Das lokale Ollama-Modell wählt eine zurückhaltende
Mimik aus Beitrag und Antwort. Sie beschreibt Lunas Darstellung, nicht vermeintlich
erkannte Gefühle des Menschen. Fehler oder eine ausgelastete Klassifikation fallen
auf neutral zurück. Die optionale Zusatzanfrage hat acht Sekunden Zeitlimit;
`expressions: false` schaltet sie ab.

Die Lippen folgen dem Spektrum des tatsächlich abgespielten TTS-Audios:
**eine Echtzeit-Näherung, keine phonetisch exakte Lippensynchronisation.** Stille
und Unterbrechungen schließen den Mund. Audio wird zunächst vollständig geladen;
Streaming und zeitgestempelte Phoneme sind offen. Die Audio-URL muss von derselben
HA-Instanz stammen.

Hintergrund und Kleidung sind von Sitzung und Mimik getrennt. Weitere Outfits sind
noch nicht implementiert. Für alle späteren Kleidungsvarianten gilt verbindlich:
**Safe for Work, altersgerecht und vollständig nicht sexualisiert.** Identität und
Animationsfunktionen sollen beim Outfitwechsel erhalten bleiben. Frigate und
Robotersteuerung sind bislang Konzept, siehe [Umsetzungsplan](browser-avatar-plan.md).

## Updates und Tests

Der Static-Endpunkt setzt keinen Langzeit-Cache. Nach Updates HA neu starten und
die Seite neu laden. Den `v`-Parameter setzt die Integration automatisch auf ihre
installierte Versionsnummer.
Externe CDN-Skripte werden nicht benötigt.

### „Custom element doesn't exist: luna-avatar-card“

Diese Meldung bedeutet, dass der Browser das Kartenmodul noch nicht erfolgreich
geladen hat. Sie entsteht vor Mikrofon-, Pipeline- oder Ollama-Zugriffen.

1. Prüfen, dass in HA mindestens Luna **0.4.0b2** installiert und die Integration
   erfolgreich eingerichtet ist. Auch nach einer manuellen Dateikopie HA neu starten.
2. In demselben Browser die eigene HA-Adresse mit
   `/luna-local/luna-avatar-card.js` am Ende öffnen. Es muss JavaScript erscheinen.
   Bei **404** fehlen die neuen Dateien oder der Static-Endpunkt wurde nicht
   registriert. Dann Installation und HA-Protokoll auf Luna-Setupfehler prüfen.
3. Wird JavaScript angezeigt, die Dashboard-Seite vollständig neu laden. Seit b2
   registriert die Integration das Modul automatisch. Bei der älteren b1 war noch
   ein Ressourceneintrag als **JavaScript-Modul** nötig; YAML allein genügte nicht.
4. Bleibt der Fehler, in den Browser-Entwicklerwerkzeugen unter Netzwerk/Konsole
   nach dem ersten Ladefehler für `luna-avatar-card.js`, `session.mjs` oder `rig.mjs`
   suchen. HTTP-Status, MIME-Fehler oder JavaScript-Fehler unterscheiden die Ursache.

Ein erfolgreicher Abruf der Hauptdatei allein beweist noch nicht, dass ihre beiden
importierten Module geladen und ausgeführt wurden.

Frontend-Tests: `node --test tests/test_avatar_session.mjs`. Die Seite
`tests/avatar-preview.html` zeigt das Rig ohne HA-Verbindung über einen lokalen
HTTP-Server und aktiviert kein Mikrofon.

Vor produktiver Freigabe noch in HA prüfen: Mikrofon-Berechtigungen, tatsächliche
STT/TTS-Anbieter, Tablet/Safari, wiederholtes Öffnen/Schließen, Unterbrechungen und
deutsche Aussprache. Die endgültige Illustration braucht eine eigene bewegte
Qualitätsprüfung, bevor sie das Vorschau-Rig ersetzt.
