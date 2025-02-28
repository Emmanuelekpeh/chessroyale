#!/bin/bash

# Remove any existing lock files
rm -f package-lock.json
rm -f yarn.lock

# Install root dependencies
yarn install

# Install shared package dependencies
yarn workspace @chessroyale/shared add -D typescript @types/node vitest

# Install server package dependencies
yarn workspace @chessroyale/server add express drizzle-orm
yarn workspace @chessroyale/server add -D typescript @types/node @types/express @types/express-session @types/passport @types/passport-local @types/ws @types/cors @types/compression drizzle-kit tsx

# Install client package dependencies
yarn workspace @chessroyale/client add @tanstack/react-query chess.js react react-dom react-chessboard wouter
yarn workspace @chessroyale/client add -D @vitejs/plugin-react typescript @types/node @types/react @types/react-dom vite autoprefixer postcss

# Create necessary TypeScript config files if they don't exist
cat > tsconfig.base.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
EOL

# Ensure Vite config exists
cat > vite.config.mts << EOL
import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    strictPort: true,
    host: true,
  }
});
EOL

# Create client tsconfig
cat > client/tsconfig.json << EOL
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vite/client", "node"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOL

# Create server tsconfig
cat > server/tsconfig.json << EOL
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"],
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

# Create shared tsconfig
cat > shared/tsconfig.json << EOL
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

# Add PostCSS config
cat > postcss.config.js << EOL
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  }
}
EOL

# Create directories if they don't exist
mkdir -p shared/src
mkdir -p server/src
mkdir -p client/src

# Build packages in order
yarn build:shared
yarn build:server
yarn build:client
