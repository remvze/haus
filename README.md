<div align="center">
  <h2>Haus 🏡</h2>
  <p>A dead-simple online workstation.</p>
  <a href="https://use.haus">Visit <strong>Haus</strong></a> | <a href="https://buymeacoffee.com/remvze">Buy Me a Coffee</a>
  <br/><br/>
  <div>
    <a href="https://gitviews.com/">
      <img src="https://gitviews.com/repo/remvze/haus.svg" alt="Repo Views" />
    </a>
  </div>
</div>

---

## Table of Contents

- 🏠 [WHat is Haus?](#what-is-haus)
- ⚡ [Features](#features)
- 🐳 [Self-Hosting](#self-hosting)
- 🧰 [Development](#development)

## What is Haus?

Haus is a simple, free, open-source online workstation. It provides a flexible workspace with movable and resizable windows so you can arrange your tools exactly the way you like; no account required.

## Features

- 📝 **Notepad**: Quick, lightweight text editing.
- ✔️ **Todo List**: Simple task tracking.
- ⏱️ **Pomodoro Timer**: Stay focused with structured sessions.
- ⏲️ **Advanced Countdown Timer**: Custom countdowns with options.
- 🎧 **Ambient Sound Player**: Background sounds for concentration.
- 🌬️ **Breathing Exercise Tool**: Guided breathing for relaxation.
- 🪟 **Custom Layout**: Movable and resizable tool windows.
- 🔓 **No Account Needed**: Everything works instantly.
- 🐳 **Self-hostable**: Docker image is available.

## Self-Hosting

### 1. Run with Docker

```bash
docker run -d \
  --name haus \
  -p 8080:8080 \
  ghcr.io/remvze/haus:latest
```

The open:

```
http://localhost:8080
```

### 2. Run with Docker Compose

A `docker-compose.yml` is included at the project root.

Run:

```bash
docker compose up -d
```

Then open:

```
http://localhost:8080
```

## Development

Clone the repo and run locally (optional):

```bash
npm install
npm run dev
```
