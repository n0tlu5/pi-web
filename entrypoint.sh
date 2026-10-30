#!/bin/sh
set -e

AGENT_DIR="${PI_CODING_AGENT_DIR:-/data/agent}"
mkdir -p "$AGENT_DIR"
mkdir -p /workspace

git config --global --add safe.directory '*' 2>/dev/null || true

if [ ! -f "$AGENT_DIR/models.json" ]; then
  echo "[entrypoint] Initializing $AGENT_DIR/models.json from defaults..."
  cp /etc/pi-web/default-models.json "$AGENT_DIR/models.json"
fi

if [ ! -f "$AGENT_DIR/settings.json" ]; then
  echo "[entrypoint] Initializing $AGENT_DIR/settings.json from defaults..."
  cp /etc/pi-web/default-settings.json "$AGENT_DIR/settings.json"
else
  node -e '
    const fs = require("fs");
    const p = process.argv[1];
    try {
      const s = JSON.parse(fs.readFileSync(p, "utf8"));
      s.packages = s.packages || [];
      if (!s.packages.includes("/opt/omo-plugin")) {
        s.packages = ["/opt/omo-plugin", ...s.packages];
        fs.writeFileSync(p, JSON.stringify(s, null, 2), "utf8");
      }
    } catch (e) {}
  ' "$AGENT_DIR/settings.json" 2>/dev/null || true
fi

if [ ! -f "$AGENT_DIR/SYSTEM.md" ]; then
  echo "[entrypoint] Initializing $AGENT_DIR/SYSTEM.md from defaults..."
  cp /etc/pi-web/default-SYSTEM.md "$AGENT_DIR/SYSTEM.md"
fi

mkdir -p "$HOME/.omo"
if [ ! -f "$HOME/.omo/omo.jsonc" ]; then
  echo "[entrypoint] Initializing $HOME/.omo/omo.jsonc from defaults..."
  cp /etc/pi-web/default-omo.jsonc "$HOME/.omo/omo.jsonc"
fi

if [ ! -d "/workspace/.git" ]; then
  echo "[entrypoint] Initializing git repository in /workspace..."
  git -C /workspace init -b main 2>/dev/null || git -C /workspace init 2>/dev/null || true
  git -C /workspace config user.name "Pi User" 2>/dev/null || true
  git -C /workspace config user.email "pi@local" 2>/dev/null || true
fi

PORT="${PORT:-3088}"
HOSTNAME="${PI_WEB_HOSTNAME:-0.0.0.0}"

echo "[entrypoint] Starting pi-web on ${HOSTNAME}:${PORT}..."
echo "[entrypoint] Using pi agent dir: ${AGENT_DIR}"

exec pi-web -p "$PORT" -H "$HOSTNAME" --no-open
