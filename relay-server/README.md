# MTG Life Tracker - Local Relay Server (LAN/Wi‑Fi)

Serveur Node.js minimaliste pour relayer les updates de partie via SSE.

Objectif :

- Smartphone (contrôleur) envoie les updates en `POST /api/stream`
- Overlay (PC OBS, navigateur) écoute en `GET /api/stream` via SSE

Aucune dépendance externe, uniquement Node.js.

## 1) Lancer le serveur relay

Prérequis : Node.js 18+

```bash
cd relay-server
npm start
```

Par défaut :

- Host: `0.0.0.0`
- Port: `8787`
- URL LAN typique: `http://192.168.1.42:8787`

Variables optionnelles:

```bash
HOST=0.0.0.0 PORT=8787 CORS_ALLOW_ORIGIN=* npm start
```

## 2) Configurer le smartphone (Contrôleur)

Dans ton app :

- Activer `isStreamMode`
- Régler `remoteServerUrl` à l'URL du relay (sans `/api/stream`), par ex:
  - `http://192.168.1.42:8787`

L'app enverra automatiquement les changements de PV vers :

- `POST http://192.168.1.42:8787/api/stream`

## 3) Ouvrir l'overlay stream

URL overlay (sur GitHub Pages ou ton hébergement statique):

```text
https://naereen.github.io/My-Android-app-to-track-life-points-at-Magic-the-Gathering/stream?server=http://192.168.1.42:8787
```

L'overlay écoute alors :

- `GET http://192.168.1.42:8787/api/stream`

## 4) Vérifier que le relay tourne

```bash
curl http://192.168.1.42:8787/health
```

Réponse attendue:

```json
{"ok":true,"connectedClients":0,"updatedAt":...}
```

## Notes réseau

- Tous les appareils doivent être sur le même LAN/Wi‑Fi.
- Ouvrir le port `8787` dans le firewall du PC serveur si nécessaire.
- Si un reverse-proxy Nginx est utilisé, désactiver le buffering SSE sur cette route.
