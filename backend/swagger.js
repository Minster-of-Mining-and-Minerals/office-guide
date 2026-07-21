const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const BACKEND_URL = process.env.BASE_URL || process.env.BACKEND_PUBLIC_URL || "http://localhost:4001";

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Minister Of Mines Office Guide API",
      version: "1.0.0",
      description: "API Documentation for the Office Guide application",
    },
    servers: [
      {
        url: BACKEND_URL,
        description: "Current server",
      },
      {
        url: "http://localhost:4001",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
