# Auqli Server

Backend API server for the Auqli application.

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with necessary environment variables (see `.env.example`).

3. Start the development server:
   ```
   npm run dev
   ```

## Running with Docker Compose

1. Make sure Docker and Docker Compose are installed on your system.

2. Build and run the containers:
   ```
   docker-compose up --build
   ```

3. The API will be available at `http://localhost:8000`.

## Deployment to Back4App

When deploying to Back4App, follow these steps to ensure proper functionality:

1. In Back4App, create a new Docker Container app.

2. Add the following environment variables in the Back4App dashboard:
   - `MONGODB_URI` - Your MongoDB connection string
   - `NODE_ENV` - Set to `production`
   - `PORT` - Set to `8000`
   - `MONGODB_CONNECTION_RETRIES` - Set to `5` 
   - `MONGODB_RETRY_INTERVAL` - Set to `5000`
   - Add all other required environment variables from your `.env` file

3. Connect your GitHub repository or upload your code to Back4App.

4. Deploy the application.

### Troubleshooting Back4App Deployment

If you encounter issues with your Back4App deployment:

1. **Container not starting**: Check the logs for MongoDB connection errors. Make sure your MongoDB URI is correct and accessible from Back4App's infrastructure.

2. **Health check failing**: The application implements a `/health` endpoint that checks database connectivity. If the MongoDB connection fails, the health check will fail.

3. **Database connection retries**: The application will automatically attempt to reconnect to MongoDB several times before giving up.

## Docker Health Check

The Docker health check uses the `/health` endpoint to verify the application is running properly. This checks:

- Server uptime
- MongoDB connection status
- Memory usage

The health check will fail if the MongoDB connection is not established.

## Project Structure

- `src/` - Application source code
  - `config/` - Configuration files
  - `controllers/` - Request handlers
  - `models/` - Database models
  - `routes/` - API routes
  - `utils/` - Utility functions
  - `socket/` - Socket.io implementation
- `server.js` - Application entry point
