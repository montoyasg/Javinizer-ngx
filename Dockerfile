FROM python:3.9.6-bullseye

# Add docker entrypoint script
ADD docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Install dependencies
RUN apt-get update \
    && apt-get install -y unzip wget

# Create directories
RUN mkdir -p /home/data/Repository/.universal \
    && mkdir -p /home/data/Repository/apps \
    && mkdir -p /home/Universal

# Add dashboard files
ADD src/Javinizer/Universal/Repository/javinizergui.ps1 /home/data/Repository/apps
ADD src/Javinizer/Universal/Repository/dashboards.ps1 /home/data/Repository/.universal

# Download PowerShell Universal 2026.1.5
WORKDIR /home
RUN wget -O /home/Universal.linux-x64.zip https://powershelluniversal.devolutions.net/download/psu/linux-x64/2026.1.5.0

# Extract PowerShell Universal to /home/Universal
RUN unzip -q /home/Universal.linux-x64.zip -d /home/Universal/ \
    && chmod +x /home/Universal/Universal.Server \
    && rm /home/Universal.linux-x64.zip

# Install mediainfo
RUN apt-get install -y mediainfo

# Install pwsh
RUN wget https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y powershell \
    && rm -rf /var/lib/apt/lists/*

# Install pwsh modules
RUN pwsh -c "Set-PSRepository 'PSGallery' -InstallationPolicy Trusted" \
    && pwsh -c "Install-Module Javinizer"

# Install python modules
RUN pip3 install pillow \
    google_trans_new \
    googletrans==4.0.0rc1 \
    requests

# Create symlink to module settings file
RUN pwsh -c "ln -s (Join-Path (Get-InstalledModule Javinizer).InstalledLocation -ChildPath jvSettings.json) /home/jvSettings.json"

# Add PowerShell Universal environment variables
ENV Kestrel__Endpoints__HTTP__Url http://*:8600
ENV Data__RepositoryPath ./data/Repository
ENV Data__ConnectionString ./data/database.db
ENV Logging__SystemLogPath ./data/logs/log.txt

EXPOSE 8600
ENTRYPOINT ["/docker-entrypoint.sh"]
