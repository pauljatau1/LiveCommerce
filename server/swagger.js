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
      schemas: {
        Success: {
          type: 'boolean',
          example: true,
        },
        Message: {
          type: 'string',
          example: 'List retrieved successfully',
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 3 },
            totalUsers: { type: 'integer', example: 7 },
            pages: { type: 'integer', example: 3 },
          },
          required: ['page', 'limit', 'totalUsers', 'pages'],
        },
        Listing: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60c72b2f9b1e8a001c8d4567' },
            userId: { type: 'string', example: '68510f842d568c5353a5b5c0' },
            name: { type: 'string', example: 'Sample listing name' },
            quantity: { type: 'string', example: '5' },
            color: { type: 'string', example: 'Red' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'userId', 'name', 'status', 'created_at', 'updated_at']
        },
        UserPublic: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '66510f842d568c5353a5b5c1' },
            name: { type: 'string', example: 'Alice Smith' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            companyName: { type: 'string', example: 'Acme Corp' },
            isAdmin: { type: 'boolean', example: false },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            created_at: { type: 'string', format: 'date-time', example: '2025-06-19T12:34:56.789Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-06-19T12:34:56.789Z' },
          },
          required: ['id', 'name', 'email', 'status', 'created_at', 'updated_at']
        }
      }
    },
  },
  apis: [
    './src/routes/*.js', 
    './src/modules/user/routes/*.js', 
    './src/modules/listing/routes/*.js', 
    './src/modules/buyer/routes/*.js'
  ], 
};

// Generate the spec
let specs = swaggerJsdoc(options);

// Filter out admin routes from documentation
// This removes any path that starts with /api/admin
specs = {
  ...specs,
  paths: Object.fromEntries(
    Object.entries(specs.paths || {}).filter(([path]) => !path.startsWith('/api/admin'))
  ),
  tags: (specs.tags || []).filter(tag => tag.name !== 'Admin' && tag.name !== 'Announcements' && tag.name !== 'Finance' && tag.name !== 'Streams')
};

module.exports = { swaggerUi, specs };
