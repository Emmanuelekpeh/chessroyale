#!/bin/bash

# Remove any existing lock files
rm -f package-lock.json yarn.lock

# Install dependencies
yarn install


# Install workspace-specific dependencies
yarn workspace @chessroyale/shared add zod drizzle-orm
yarn workspace @chessroyale/shared add -D typescript @types/node

yarn workspace @chessroyale/server add express passport passport-local express-session memorystore cors compression @neondatabase/serverless drizzle-orm ws nanoid
yarn workspace @chessroyale/server add -D typescript @types/node @types/express @types/passport @types/passport-local @types/express-session @types/cors @types/compression @types/ws vite

yarn workspace @chessroyale/client add react react-dom # ... other client deps

# Install shared package dependencies
yarn workspace @chessroyale/shared add -D typescript @types/node vitest

# Install server package dependencies
yarn workspace @chessroyale/server add express drizzle-orm
yarn workspace @chessroyale/server add -D typescript @types/node @types/express @types/express-session @types/passport @types/passport-local @types/ws @types/cors @types/compression drizzle-kit tsx

# Install client package dependencies
yarn workspace @chessroyale/client add @tanstack/react-query chess.js react react-dom react-chessboard wouter
yarn workspace @chessroyale/client add -D @vitejs/plugin-react typescript @types/node @types/react @types/react-dom vite autoprefixer postcss


# Update TypeScript configurations
cat > tsconfig.base.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true,
    "declaration": true
  }
}
EOL

cat > shared/tsconfig.json << EOL
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOL

cat > server/tsconfig.json << EOL
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../shared" }]
}
EOL

# Build packages in order
yarn workspace @chessroyale/shared build
yarn workspace @chessroyale/server build
yarn workspace @chessroyale/client build
