# Glama.ai deployment image for Quickbase MCP Server
FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PATH="/home/service-user/.local/bin:${PATH}"

# Create non-root user and install Node.js + mcp-proxy
RUN groupadd -r service-user \
    && useradd -u 1987 -r -m -g service-user service-user \
    && mkdir -p /app \
    && chown -R service-user:service-user /app \
    && apt-get update \
    && apt-get install -y --no-install-recommends curl git ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g mcp-proxy@3.0.3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER service-user
WORKDIR /app

RUN git clone https://github.com/danielbushman/MCP-Quickbase . && git checkout main
RUN npm install && npm run build

CMD ["mcp-proxy", "node", "dist/mcp-stdio-server.js"]
