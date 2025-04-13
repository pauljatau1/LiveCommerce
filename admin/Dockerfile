# Use Node.js v18
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Add these environment variables
ENV PORT=5173

# Expose the port
EXPOSE 5173

CMD [ "npm", "run", "dev" ]