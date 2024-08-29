FROM python:3.10.12-slim

WORKDIR /app

# Combine RUN commands and clean up in the same layer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libavfilter-dev \
    libswscale-dev \
    libswresample-dev \
    build-essential \
    libcairo2-dev \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.lock ./
COPY product_horse ./product_horse
COPY storage_client ./storage_client
COPY scripts/setup_env.py ./setup_env.py
COPY sql_files ./sql_files
COPY .env.production .
RUN PYTHONDONTWRITEBYTECODE=1 pip install -r requirements.lock

# Run setup script
RUN --mount=type=secret,id=dotenv_key \
    export DOTENV_PRIVATE_KEY_PRODUCTION=$(cat /run/secrets/dotenv_key) && \
    dotenvx run -f .env.production -- python setup_env.py

EXPOSE 8000

CMD ["dotenvx", "run", "-f", ".env.production", "--", "fastapi", "run", "product_horse/graphql.py"]