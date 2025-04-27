const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auqli API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Auqli application',
    },
    servers: [
      {
        url: 'https://api.staging.auqli.live', 
      },
      {
        url: 'https://api.auqli.live', 
      },
      {
        url: 'http://localhost:8000', 
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], 
};

// Generate the spec
let specs = swaggerJsdoc(options);

// Filter out admin routes from documentation
// This removes any path that starts with /api/admin
specs = {
  ...specs,
  paths: Object.fromEntries(
    Object.entries(specs.paths || {}).filter(([path]) => !path.startsWith('/api/adminnnn'))
  ),
  tags: (specs.tags || []).filter(tag => tag.name !== 'Admin' && tag.name !== 'Announcements' && tag.name !== 'Finance' && tag.name !== 'Streams')
};

module.exports = { swaggerUi, specs };
