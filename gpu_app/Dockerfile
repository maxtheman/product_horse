# Stage 1: Build FFmpeg
# added --enable-cuvid
#     --enable-cuvid \
# --enable-cuda-llvm \
# --enable-ffnvcodec \
# --enable-shared \
# --enable-libnpp \
# --enable-opencl \
FROM nvidia/cuda:12.3.0-devel-ubuntu22.04 as ffmpeg-builder

# Install FFmpeg build dependencies
RUN apt-get update && apt-get install -y \
    git \
    yasm \
    build-essential \
    cmake \
    libtool \
    libc6 \
    libc6-dev \
    unzip \
    wget \
    libnuma1 \
    libnuma-dev \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libfdk-aac-dev \
    libmp3lame-dev \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

# Compile FFmpeg with NVIDIA GPU support
RUN git clone https://github.com/FFmpeg/nv-codec-headers.git && \
    cd nv-codec-headers && \
    git checkout n12.1.14.0 && \
    make install && \
    cd .. && \
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
    --enable-cuvid \
    --enable-libfdk-aac \
    --enable-libmp3lame \
    --enable-libopus \
    --enable-nvenc \
    --enable-shared \
    --disable-static \
    && make -j8 \
    && make install

# Stage 2: Final image - formerly used nvidia/cuda:11.8.0-runtime-ubuntu22.04, but CUDA isn't needed at runtime
# FROM nvidia/cuda:12.3.0-runtime-ubuntu22.04
FROM python:3.10.12-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies
# adding the cuda stuff adds libs used in symlinks below
# cuda-nvcc-12-3 \
# libcublas-12-3 \
# libcudnn8 \
RUN apt-get update && apt-get install -y \
    curl \
    libpq-dev \
    libcairo2-dev \
    imagemagick \
    pkg-config \
    gcc \
    build-essential \
    ca-certificates \
    wget \
    python3 \
    python3-pip \
    && curl -sfS https://dotenvx.sh/install.sh | sh \
    && sed -i 's/rights="none" pattern="@\*"/rights="read|write" pattern="@*"/' /etc/ImageMagick-6/policy.xml \
    && apt-get clean \
    && wget -qO /cuda-keyring.deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb \
    && dpkg -i /cuda-keyring.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    nvidia-driver-545 \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /cuda-keyring.deb

# | NVIDIA-SMI 545.23.08              Driver Version: 545.23.08    CUDA Version: 12.3  

#    ldd /usr/local/bin/ffmpeg is the source
COPY --from=ffmpeg-builder /usr/local/bin/ /usr/local/bin/
COPY --from=ffmpeg-builder /usr/local/lib/libavdevice.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libavfilter.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libavformat.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libavcodec.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libpostproc.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libswresample.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libswscale.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/local/lib/libavutil.so.* /usr/local/lib/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libvpx.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libfdk-aac.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libmp3lame.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libopus.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libx264.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/lib/x86_64-linux-gnu/libx265.so.* /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/local/cuda/lib64/libnppig.so.* /usr/local/cuda/lib64/
COPY --from=ffmpeg-builder /usr/local/cuda/lib64/libnppicc.so.* /usr/local/cuda/lib64/
COPY --from=ffmpeg-builder /usr/local/cuda/lib64/libnppidei.so.* /usr/local/cuda/lib64/
COPY --from=ffmpeg-builder /usr/local/cuda/lib64/libnppif.so.* /usr/local/cuda/lib64/
COPY --from=ffmpeg-builder /usr/local/cuda/lib64/libnppc.so.* /usr/local/cuda/lib64/

ENV LD_LIBRARY_PATH="/usr/local/lib:/usr/local/cuda/lib64:/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH}"
ENV FFMPEG_BINARY="/usr/local/bin/ffmpeg"

# adding these symlinks is necessary to get ffmpeg to use the gpu
RUN [ ! -e /usr/lib/x86_64-linux-gnu/libnvcuvid.so ] && ln -s /usr/lib/x86_64-linux-gnu/libnvcuvid.so.1 /usr/lib/x86_64-linux-gnu/libnvcuvid.so || echo "Symlink for libnvcuvid.so already exists"
RUN [ ! -e /usr/lib/x86_64-linux-gnu/libnvidia-encode.so ] && ln -s /usr/lib/x86_64-linux-gnu/libnvidia-encode.so.1 /usr/lib/x86_64-linux-gnu/libnvidia-encode.so || echo "Symlink for libnvidia-encode.so already exists"
RUN ldconfig

ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility,video

RUN ffmpeg -encoders | grep -q h264_nvenc || (echo "h264_nvenc codec not found" && exit 1)
# can't test ffmpeg more directly because deploy has no gpu, but if I could, heres a 1 second test you could run with no output:
# ffmpeg -hwaccel cuda -hwaccel_output_format cuda -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -c:v h264_nvenc -preset fast -b:v 5M -f null -

# Copy the dist files into the image
# /Users/max/Documents/product_horse/gpu_app/product_horse-0.1.0-py3-none-any.whl
COPY gpu_app/product_horse-0.1.0-py3-none-any.whl ./
COPY gpu_app/product_horse-0.1.0.tar.gz ./
COPY ../storage_client /app/storage_client

# Assert that storage_client is not empty
RUN if [ -z "$(ls -A /app/storage_client)" ]; then \
    echo "Error: storage_client directory is empty" && exit 1; \
fi

# Install the wheel file and the local dependency
RUN pip3 install --upgrade pip && \
    pip3 install product_horse-0.1.0-py3-none-any.whl && \
    pip3 install /app/storage_client

# Remove the copied dist files to keep the image clean
RUN rm product_horse-0.1.0-py3-none-any.whl product_horse-0.1.0.tar.gz

RUN apt-get update && apt-get install -y s3fs

# Copy environment file
COPY ../.env.production .

# Copy the private key from the secret
COPY --chmod=0400 .env.keys.production .env.keys

RUN mkdir -p ${HOME}/.aws
RUN mkdir /storage
RUN dotenvx run -f .env.production -- sh -c 'echo "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" > ${HOME}/.passwd-s3fs'
RUN dotenvx run -f .env.production -- chmod 600 ${HOME}/.passwd-s3fs

RUN rm .env.keys

COPY gpu_app/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Command to run the FastAPI application
EXPOSE 8000

# Use the startup script as the entrypoint
ENTRYPOINT ["/app/start.sh"]