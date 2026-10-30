FROM docker.io/library/node:22-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      git \
      curl \
      ca-certificates \
      procps \
      python3 && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g --fetch-retries=5 \
    @agegr/pi-web@latest \
    @earendil-works/pi-coding-agent@latest \
    omo-ai@latest

COPY setup-omo.js /tmp/setup-omo.js
RUN node /tmp/setup-omo.js && rm /tmp/setup-omo.js

RUN ln -sf /usr/local/bin/omo /usr/local/bin/pi

RUN mkdir -p /etc/pi-web /data /workspace /opt/omo-plugin /home/node/.omo && \
    chown -R node:node /data /workspace /opt/omo-plugin /home/node/.omo

COPY default-models.json /etc/pi-web/default-models.json
COPY default-settings.json /etc/pi-web/default-settings.json
COPY default-omo.jsonc /etc/pi-web/default-omo.jsonc
COPY default-SYSTEM.md /etc/pi-web/default-SYSTEM.md
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENV PORT=3088 \
    PI_WEB_HOSTNAME=0.0.0.0 \
    PI_WEB_NO_OPEN=1 \
    PI_CODING_AGENT_DIR=/data/agent \
    HOME=/home/node

USER node
WORKDIR /workspace

EXPOSE 3088

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
