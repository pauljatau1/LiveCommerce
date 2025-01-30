# Use Node.js v18
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Add these environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose the port
EXPOSE 8000

RUN apt-get update && apt-get install -y \
    libx264-dev \
    libx265-dev \
    libvpx-dev \
    libopus-dev \
    libmp3lame-dev \
    libnuma-dev \
    && rm -rf /var/lib/apt/lists/*

CMD [ "node", "server.js" ]