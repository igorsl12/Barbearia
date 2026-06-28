FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Instala Node.js + npm via NodeSource antes das features.
# A feature do Claude Code exige Node/npm presentes; instalar aqui garante
# que estejam disponiveis independente da ordem de instalacao das features.
RUN apt-get update \
    && apt-get install -y curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia as managed-settings para que nenhum usuário consiga sobrescrever
RUN mkdir -p /etc/claude-code
COPY managed-settings.json /etc/claude-code/managed-settings.json
