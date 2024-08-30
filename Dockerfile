FROM python:3.10.12-slim

WORKDIR /app

# Combine RUN commands and clean up in the same layer
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    libcairo2-dev \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# RUN apt-get update && apt-get install -y \
#     ffmpeg \
#     curl \
#     pkg-config \
#     libavformat-dev \
#     libavcodec-dev \
#     libavdevice-dev \
#     libavutil-dev \
#     libavfilter-dev \
#     libswscale-dev \
#     libswresample-dev \
#     build-essential \
#      \
#     && curl -sfS https://dotenvx.sh/install.sh | sh \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements-no-media.txt ./
COPY product_horse ./product_horse
COPY storage_client ./storage_client
COPY .env.production .
# look into adding --no-cache-dir to this
RUN PYTHONDONTWRITEBYTECODE=1 pip install -r requirements-no-media.txt

EXPOSE 8000

CMD ["dotenvx", "run", "-f", ".env.production", "--", "fastapi", "run", "--workers", "3", "product_horse/graphql.py"]