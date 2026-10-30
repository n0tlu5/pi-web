# Isolated Pi Web (with OmO) Container Deployment

A containerized deployment of [Pi Web](https://github.com/agegr/pi-web) running in an isolated Podman container, integrated with **OmO (Oh My OpenCode / Senpi)** multi-agent orchestration.

## Configuration & Architecture

- **Host Port**: `3088` (mapped to container port `3088`)
- **Container Name**: `pi-web`
- **Image**: `localhost/pi-web:latest`
- **Package**: `@agegr/pi-web@latest` with `@earendil-works/pi-coding-agent@latest`
- **Agent Orchestrator**: **OmO** (Sisyphus orchestrator, task fan-out, categories, subagents, workflows, LSP tools, memory)
- **CPA Service**: Connected to host CPA proxy via `http://host.containers.internal:8317/v1`
- **Default Model**: `gemini-3.8-flash-high` (provider `cpa`)
- **Default Thinking Level**: `high`
- **Allowed Hosts**: `minis-pi.n0tlu5.com`, `localhost`, `127.0.0.1`
- **Isolation**:
  - Runs in a container network namespace with access to host CPA via `host.containers.internal`.
  - Persistent storage is isolated across three dedicated Podman volumes:
    - `pi-web-data`: Stores Pi agent configuration, model registries, settings, extensions, and session logs (`/data` -> `/data/agent`).
    - `pi-web-workspace`: Stores workspace project files and Git repositories (`/workspace`).
    - `pi-web-omo`: Stores OmO configuration (`omo.jsonc`), agent memories, task execution state, and transcripts (`/home/node/.omo`).
  - Runs as non-root user `node` (UID 1000).

## OmO Integration & Gemini Compatibility

- **Orchestration Suite**: Full OmO plugin (`/opt/omo-plugin`) loaded as a system package.
- **Tools**: Includes `task`, `task_send`, `task_cancel`, `task_output`, `workflow`, `workpool`, `memory`, and full `lsp_*` tools.
- **Subagents & Categories**: Pinned to `cpa/gemini-3.8-flash-high` via `/etc/pi-web/default-omo.jsonc`.
- **System Prompt**: Pinned to OmO senior engineer persona with strict Intent Gate protocol via `default-SYSTEM.md`.
- **Schema Sanitization**: Tool schemas are recursively sanitized during image build (`setup-omo.js`) to remove custom keywords (such as `optional: true`), ensuring full compatibility with Google Gemini and CPA OpenAI-compatible endpoints.

## Management Commands

### Start / Deploy
```bash
cd /home/n0tlu5/Documents/pi-web
podman-compose up -d
```

### Stop
```bash
cd /home/n0tlu5/Documents/pi-web
podman-compose down
```

### View Logs
```bash
podman logs -f pi-web
```

### Rebuild Image
```bash
cd /home/n0tlu5/Documents/pi-web
podman build -t localhost/pi-web:latest .
```

## Accessing Pi Web

Open your web browser and navigate to:
```
https://minis-pi.n0tlu5.com
```
or locally:
```
http://localhost:3088
```
