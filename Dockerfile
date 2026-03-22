# ── Stage 1: Build React frontend ──
FROM node:22-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Runtime ──
FROM python:3.12-slim

# Install PowerShell and mediainfo
RUN apt-get update \
    && apt-get install -y curl gnupg apt-transport-https mediainfo \
    && curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/microsoft.list \
    && apt-get update \
    && apt-get install -y powershell \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
    && pip install --no-cache-dir pillow googletrans==4.0.0rc1 requests

# Install PowerShell modules
RUN pwsh -c "Set-PSRepository 'PSGallery' -InstallationPolicy Trusted" \
    && pwsh -c "Install-Module Javinizer"

# Create symlink to module settings file
RUN pwsh -c "ln -s (Join-Path (Get-InstalledModule Javinizer).InstalledLocation -ChildPath jvSettings.json) /home/jvSettings.json"

# Copy backend
COPY backend/ /app/backend/

# Copy built frontend
COPY --from=frontend-build /build/dist /app/frontend/dist

WORKDIR /app
ENV JV_SETTINGS_PATH=/home/jvSettings.json

EXPOSE 8600

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8600"]
