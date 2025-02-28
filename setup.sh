#!/bin/bash

# Remove any existing lock files
rm -f package-lock.json
rm -f yarn.lock

# Install root dependencies
yarn install

# Install shared package dependencies
yarn workspace @chessroyale/shared add -D typescript@5.6.3 @types/node@20.16.11 vitest@3.0.5

# Install server package dependencies
yarn workspace @chessroyale/server add express@4.0.0 drizzle-orm@0.28.0
yarn workspace @chessroyale/server add -D typescript@5.6.3 @types/node@20.16.11 @types/express@4.17.21 drizzle-kit@0.19.0 tsx@3.12.0

# Install client package dependencies
yarn workspace @chessroyale/client add @tanstack/react-query@5.66.5 chess.js@1.0.0 react@18.3.1 react-dom@18.3.1 react-chessboard@4.7.2 wouter@3.6.0
yarn workspace @chessroyale/client add -D @vitejs/plugin-react@4.3.2 typescript@5.6.3 @types/node@20.16.11 @types/react@18.3.11 @types/react-dom@18.3.1 vite@5.4.9 autoprefixer@10.4.20 postcss@8.4.47 postcss-import@16.0.0 tailwindcss@3.4.14

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
