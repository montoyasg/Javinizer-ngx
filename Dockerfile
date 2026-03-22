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
    && apt-get install -y wget apt-transport-https software-properties-common \
    && wget -q "https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb" \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y powershell mediainfo \
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
