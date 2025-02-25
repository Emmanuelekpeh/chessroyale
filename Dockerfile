FROM node:18-slim

# Install Stockfish
RUN apt-get update && apt-get install -y stockfish

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Expose port
EXPOSE 8080

# Start the application
CMD ["yarn", "start"]
