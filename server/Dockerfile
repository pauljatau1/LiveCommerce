# Use Node.js v18 base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies required by sharp, canvas, and ffmpeg
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    libvips-dev \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    libmp3lame-dev \
    libnuma-dev \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=8000

# Expose the application's port
EXPOSE 8000

# Add a healthcheck with increased grace period
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the server
CMD [ "node", "server.js" ]
