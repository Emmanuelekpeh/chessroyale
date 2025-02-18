#!/bin/bash

# ChessCrunch Setup Script
echo "Setting up ChessCrunch..."

# Exit on error
set -e

# Function for error handling
handle_error() {
    echo "Error occurred in setup at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Create necessary directories
mkdir -p logs

# Check required system dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies for puzzle rating calculation
echo "Installing Python dependencies..."
pip install scikit-learn numpy pandas

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
PGUSER=[username]
PGPASSWORD=[password]
PGDATABASE=[database]
PGHOST=[host]
PGPORT=[port]

# Application Configuration
PORT=3001
NODE_ENV=development

# Session Configuration (Generate a secure random string)
SESSION_SECRET=$(openssl rand -hex 32)

# Optional: OpenAI Configuration (if using AI features)
# OPENAI_API_KEY=your_api_key_here
EOL
    echo "Created .env file template. Please update with your configuration values."
fi

# Database initialization function
initialize_database() {
    echo "Initializing database..."

    if [ -z "$DATABASE_URL" ]; then
        echo "Error: DATABASE_URL environment variable is not set"
        exit 1
    fi

    # Run database migrations
    echo "Running database migrations..."
    npm run db:push

    # Create initial data
    echo "Creating initial data..."
    NODE_ENV=development node -e "
        const { storage } = require('./server/storage');

        async function init() {
            try {
                await storage.createInitialPuzzles();
                console.log('Initial data created successfully');
            } catch (error) {
                console.error('Error creating initial data:', error);
                process.exit(1);
            }
            process.exit(0);
        }

        init();
    "
}

# Check if .env file exists and environment variables are set
if [ -f .env ]; then
    source .env
    initialize_database
else
    echo "Warning: .env file not found. Please configure your environment variables before running database initialization."
fi

# Build the application
echo "Building the application..."
npm run build

# Create a comprehensive deployment guide
cat > DEPLOYMENT.md << EOL
# ChessCrunch Deployment Guide

## Prerequisites
- Node.js 20.x or later
- Python 3.11 or later
- PostgreSQL 14 or later
- OpenAI API key (optional)

## Environment Setup
1. Run the setup script: \`./setup.sh\`
2. Update the .env file with your configuration:
   - Database credentials
   - Port configuration (default: 3001)
   - Session secret (auto-generated)
   - OpenAI API key (if using AI features)

## Database Setup
1. Create a PostgreSQL database
2. Update DATABASE_URL in .env
3. Initialize the database: \`npm run db:push\`

## Starting the Application
Development mode:
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm run build
npm start
\`\`\`

## Maintenance
- Monitor the logs in \`logs/\` directory
- Backup the database regularly
- Keep dependencies updated

## Troubleshooting
1. Database connection issues:
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

2. Port already in use:
   - Change the PORT in .env
   - Or kill the existing process

3. API rate limiting:
   - Check the rate limits in config.ts
   - Adjust if necessary

## Database Migrations
To update the database schema:
1. Edit the schema in \`shared/schema.ts\`
2. Run: \`npm run db:push\`

## Support
For issues or questions, please refer to:
- Project documentation in /docs
- Create an issue in the repository
- Contact the development team
EOL

echo "Setup complete! Please follow the instructions in DEPLOYMENT.md to finish configuring your installation."
echo "To start the application, run: npm run dev"