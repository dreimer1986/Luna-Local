# Luna zu Hause fortsetzen — Übergabe 27.10.2026

## Den richtigen Branch holen

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
| Rig-/Ebenenvorgabe | `docs/live2d/rig-contract.json` |
| Modell-Dateiprüfung | `tools/validate_live2d_model.py` |
| Echter Cubism-Web-Adapter + Build | `tools/live2d/` |
| Browser-Testseite | `tests/live2d-preview.html` |
| Früherer PNG-Versuch, archiviert | `tools/experiments/png-rig/` |
| Aktuelle HA-Karte/Sprachsitzung | `custom_components/luna_local/frontend/` |

**Das CMO3 enthält nur die unveränderte Zeichenreferenz und die Editor-Grundstruktur.**
Es ist kein fertig geriggtes Modell; eine getrennte PSD und ein Luna-MOC3-Export
existieren noch nicht. Der Adapter wurde mit dem offiziellen Hiyori-SDK-Beispiel
getestet, niemals als Luna ausgegeben. Die SDK-/Beispieldateien liegen nur lokal.

Die optische Qualität des ersten SVG-Rigs wurde vom Nutzer verworfen. Der spätere
PNG-Verformungsversuch zeigte beim halben Blinzeln Doppelkonturen. Beide nicht als
fertigen Avatar aktivieren. Live2D ist die gewählte Richtung. Die hochwertige
Aufteilung/Ergänzung der Zeichnung und das eigentliche Rigging sind offen; die
bisherige Editor-Automation hat diese künstlerische Arbeit nicht erledigt.

## Rechner einrichten

### Windows für den Cubism Editor

Auf dem Arbeits-PC: **Cubism Editor 5.3.05 beta1**, FREE-Modus; keine PRO- oder
Testlizenz aktiviert. Für dieses Referenzprojekt möglichst dieselbe Version
verwenden und späteres Speichern mit anderen Versionen an einer Kopie testen.
[Offizieller Download](https://www.live2d.com/en/cubism/download/editor/).
Live2D bietet den Editor offiziell für Windows/macOS, nicht Linux an.

Das Projekt direkt in Cubism öffnen: `docs/live2d/source/luna-reference-only.cmo3`.
Die 25-%-Deckkraft der Referenz ist die normale Zeichenhilfen-Darstellung im Editor,
kein Verlust der Originalbildqualität. Noch keine Textur-/Modellfreigabe exportieren.

### Windows oder Linux für Code und Browser

- Node.js 24 (lokal geprüft mit 24.20.0), npm; Python 3.14 für bestehende HA-Tests.
- Offizielles **Cubism SDK for Web 5 R5**, vollständig entpackt, inklusive `Core`,
  `Framework`, `Samples`. Auf dem bisherigen PC: `Downloads/Cubism/CubismSdkForWeb-5-r.5`.
- Das separate MotionSync-Paket wurde **noch nicht bereitgestellt**. Der normale
  SDK-Ordner enthält keine fertige MotionSync-Lippensynchronisation.

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

- Zuletzt auf HA verifiziert: `0.4.0b3`, Originalbild als Standard, Commit `0fb5119`.
  Die Live2D-Branch-Commits wurden nicht nach HA ausgerollt.
- Ressourcenpfad `/luna-local/luna-avatar-card.js`; zuletzt manuelle Lovelace-
  Ressource mit `?v=0.4.0b3`. Backend registriert seit b2 ebenfalls automatisch.
  Bei späteren Updates tatsächlichen HA-/HACS-/Ressourcenstand erneut prüfen.
- Sprachagent zuletzt `conversation.luna_lokal`, HACS-Entity `update.luna_local_update`.
- Vollständiger Browser-Mikrofon → Assist → TTS-Test mit realen Anbietern bleibt offen.

1. Rigging-Arbeitsweg realistisch festlegen: aufgeteilte/ergänzte PSD erstellen,
   dann Augen, Mund, Kopf und Körper im Editor riggen. Hohe Qualität nicht als
   automatische PNG-Konvertierung versprechen.
2. Frühe bewegte Probe mit neutral, Lachen, Ärger, halbem Lidschluss und Mundformen
   prüfen. Erst nach überzeugendem Ergebnis die weiteren Posen/Outfits ergänzen.
3. MotionSync-Paket und deutsche Sprachzuordnung ergänzen; tatsächliche Audiozeit
   nutzen und bei Abbruch sämtliche alten Mund-Cues verwerfen.
4. Adapter mit derselben `LunaSession` in Kachel/Popup anbinden, Fallback, Context-
   Loss, Sichtbarkeit und mehrere Instanzen prüfen; keine zweite Audiospur starten.
5. Lizenzlage für öffentliche SDK-Auslieferung klären, dann erst Release/HA-Update.

Bei Desktop-Automation muss Windows entsperrt bleiben. Bildschirm ausschalten
ist etwas anderes als die Sitzung sperren. Sperr-/Sicherheitseinstellungen wurden
nicht verändert. Falls gesperrt: Bedienung anhalten und lokal entsperren lassen.

## Einstiegstext für die nächste Sitzung

> Lies `HANDOFF.md` im Branch `work/luna-live2d-preparation` von Luna-Local.
> Setze die dort dokumentierte Arbeit fort. Bewahre Lunas freigegebene Identität;
> das Referenz-CMO3 ist noch kein Rig. Prüfe den aktuellen lokalen und HA-Stand,
> bevor du Dateien ersetzt oder eine neue Darstellung aktivierst.
