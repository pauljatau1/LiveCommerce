# Use Node.js v22
FROM node:22

# Create app directory
WORKDIR /usr/src/app

# Fix paths
RUN find src -type f -name "*.jsx" -exec sed -i 's/@\/components\/ui/@\/Components\/ui/g' {} +
RUN find src -type f -name "*.js" -exec sed -i 's/@\/components\/ui/@\/Components\/ui/g' {} +

# Bundle app source
COPY . .

# Add these environment variables
ENV PORT=5173

# Expose the port
EXPOSE 5173

CMD [ "npm", "run", "dev" ]
