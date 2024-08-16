FROM python:3.10.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg curl pkg-config libavformat-dev libavcodec-dev libavdevice-dev libavutil-dev libavfilter-dev libswscale-dev libswresample-dev build-essential libcairo2-dev
RUN curl -sfS https://dotenvx.sh/install.sh | sh

COPY requirements.lock ./
COPY product_horse ./product_horse
COPY storage_client ./storage_client
COPY scripts/setup_env.py ./setup_env.py
COPY .env.production .
RUN PYTHONDONTWRITEBYTECODE=1 pip install --no-cache-dir -r requirements.lock
RUN python setup_env.py

EXPOSE 8000

CMD ["dotenvx", "run", "-f", ".env.production", "--", "python", "-m", "product_horse.graphql"]