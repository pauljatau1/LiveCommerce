# Use Node.js v18
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Bundle app source
COPY . .

# Add these environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Install required packages for video processing and healthcheck
RUN apt-get update && apt-get install -y \
    curl \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    libmp3lame-dev \
    libnuma-dev \
    && rm -rf /var/lib/apt/lists/*

# Expose the port
EXPOSE 8000

# Add healthcheck with increased start-period for MongoDB connection
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

# Make server.js executable and start the server
RUN chmod +x server.js
CMD [ "node", "server.js" ]