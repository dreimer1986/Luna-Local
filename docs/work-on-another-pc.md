# Auf einem anderen PC weiterarbeiten

**Aktueller vollständiger Übergabestand:** [HANDOFF.md](../HANDOFF.md).
Die Live2D-Arbeit liegt im Branch `work/luna-live2d-preparation`, nicht in `master`.
Für den Wechsel diesen Branch auschecken; dort stehen auch die SDK-Versionen,
das Cubism-Referenzprojekt, die Tests und die noch offenen Schritte.

Der Projektstand wird über GitHub synchronisiert. Das umfasst Quellcode, Tests,
Dokumentation, die freigegebenen Luna-Bilder und die Bildgenerierungs-Prompts.
Ein Export des Chatverlaufs ist dafür nicht erforderlich. Der Chat allein kopiert
keine lokalen Dateien und richtet keine Anmeldung auf einem anderen PC ein.

## Zu Hause übernehmen

Git mit Git Credential Manager installieren und auf diesem PC einmal bei GitHub
anmelden. Die Anmeldung bleibt im lokalen Zugangsdaten-Speicher; Passwörter und
Tokens gehören weder in dieses Repository noch in die Remote-URL.

Beim ersten Mal:

```powershell
git clone https://github.com/dreimer1986/Luna-Local.git
cd Luna-Local
```

Bei vorhandenem Checkout zuerst `git status` prüfen. Eigene lokale Änderungen vor
dem Aktualisieren committen oder bewusst zwischenlagern; dann:

```powershell
git pull --ff-only
```

Vor dem Wechsel zurück zum anderen PC Änderungen committen und pushen. Dort wieder
mit `git pull --ff-only` übernehmen. So bleiben eventuelle Konflikte sichtbar.
Die Repositories `ha_animated_backgrounds`, `yourname_uix`, `HA-NetMD` und
`netmd_uploader` werden genauso, jeweils separat, synchronisiert.

## Was separat bleibt

- Git-Anmeldung: auf jedem PC separat über den Credential Manager.
- Python-Umgebung: lokal neu anlegen; `requirements-test.txt` enthält die Testpakete.
- HA-Konfiguration, `.env`, `secrets.yaml`, Geräte-Audioschlüssel und lokale
  Datenbanken: nicht ins öffentliche Repository aufnehmen. Sichere Backups oder
  einen geeigneten Passwortmanager verwenden.
- Lunas Erinnerungen liegen in der HA-Instanz (`luna_local_memory.sqlite3`). Ein
  Wechsel des Entwicklungs-PCs erfordert keinen Umzug dieser Datenbank. Nutzen
  beide PCs dieselbe HA-Instanz, bleibt auch Lunas Gedächtnis dasselbe. Einen Umzug
  der HA-Instanz über deren Backup/Restore abwickeln, nicht über Git.

## Einstieg für die nächste Arbeitssitzung

- [Browser-Einrichtung und Grenzen](browser-avatar.md)
- [Architektur und noch offene Schritte](browser-avatar-plan.md)
- [Gestaltung und Bildquellen](branding/README.md)
- [Tests und geprüfter Stand](verification.md)

Priorität: Browser, Kachel und Popup gleichwertig; Luna bis zur Hüfte, später
optionale Hintergründe und ausschließlich altersgerechte SFW-Kleidung. Frigate
und Roboterplattform sind zukünftige Erweiterungen. Der neue Browser-Client
benötigt noch einen vollständigen Test gegen die tatsächliche HA-Installation.
