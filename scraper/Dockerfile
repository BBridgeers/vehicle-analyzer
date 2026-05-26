FROM python:3.12-slim

# Install system deps for Playwright/Chromium (minimal but functional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libu2f-udev \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    fonts-dejavu-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browser + deps
RUN python -m playwright install chromium

# Copy scraper code
COPY fb_marketplace.py server.py ./

# Create session storage
RUN mkdir -p /root/.fb_scraper_sessions

EXPOSE 8765

CMD ["python", "server.py"]
