#!/bin/bash

echo "Starting dependency fix process..."

# Navigate to server directory
cd server

# Force reinstall types
echo "Reinstalling type declarations..."
npm install --save-dev \
  @types/express@4.17.17 \
  @types/passport@1.0.12 \
  @types/passport-local@1.0.35 \
  @types/bcrypt@5.0.0 \
  @types/jsonwebtoken@9.0.2 \
  @types/ws@8.5.5 \
  @types/cors@2.8.13 \
  @types/compression@1.7.2

echo "Dependency fix completed!"
