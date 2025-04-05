# Use Node.js v18
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies for production
RUN npm ci --only=production

# Install required system dependencies first
RUN apt-get update && apt-get install -y \
    curl \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    libmp3lame-dev \
    libnuma-dev \
    && rm -rf /var/lib/apt/lists/*

# Bundle app source
COPY . .

# Add these environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Make server.js executable
RUN chmod +x server.js

# Expose the port
EXPOSE 8000

# Add healthcheck with more graceful parameters
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD [ "node", "server.js" ]