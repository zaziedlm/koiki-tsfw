// Prisma 7 configuration file
// This file is required for Prisma 7's new configuration approach
// See: https://pris.ly/d/prisma7-client-config

import { defineConfig } from 'prisma';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
