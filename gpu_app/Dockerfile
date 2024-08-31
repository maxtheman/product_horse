# Stage 1: Build FFmpeg
FROM nvidia/cuda:11.8.0-devel-ubuntu22.04 as ffmpeg-builder

# Install FFmpeg build dependencies
RUN apt-get update && apt-get install -y \
    git \
    yasm \
    libx264-dev \
    libx265-dev \
    libnuma-dev \
    libvpx-dev \
    libfdk-aac-dev \
    libmp3lame-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# Compile FFmpeg with NVIDIA GPU support
RUN mkdir -p /tmp/ffmpeg_sources && cd /tmp/ffmpeg_sources && \
    git clone --depth 1 https://git.videolan.org/git/ffmpeg/nv-codec-headers.git && \
    cd nv-codec-headers && make install && cd .. && \
    git clone --depth 1 https://git.ffmpeg.org/ffmpeg.git ffmpeg && \
    cd ffmpeg && \
    ./configure \
    --enable-nonfree \
    --enable-cuda-nvcc \
    --enable-libnpp \
    --extra-cflags=-I/usr/local/cuda/include \
    --extra-ldflags=-L/usr/local/cuda/lib64 \
    --enable-gpl \
    --enable-libx264 \
    --enable-libx265 \
    --enable-libvpx \
    --enable-libfdk-aac \
    --enable-libmp3lame \
    --enable-libopus && \
    make -j8 && \
    make install

# Stage 2: Final image
FROM nvidia/cuda:11.8.0-base-ubuntu22.04

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    curl \
    libpq-dev \
    libcairo2-dev \
    imagemagick \
    pkg-config \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && sed -i 's/rights="none" pattern="@\*"/rights="read|write" pattern="@*"/' /etc/ImageMagick-6/policy.xml \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy FFmpeg from the builder stage
COPY --from=ffmpeg-builder /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg-builder /usr/local/bin/ffprobe /usr/local/bin/ffprobe

# Copy application files
COPY ../product_horse ./product_horse
COPY ../storage_client ./storage_client
COPY ../.env.production .

# Upgrade pip and install Python dependencies
COPY ../requirements.lock ./
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r requirements.lock

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the FastAPI application
CMD ["dotenvx", "run", "-f", ".env.production", "--", "fastapi", "run", "--host", "0.0.0.0", "--workers", "3", "product_horse/run_modal.py"]