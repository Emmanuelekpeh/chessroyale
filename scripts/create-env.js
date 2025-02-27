const fs = require('fs');
const crypto = require('crypto');

const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
PGUSER=[username]
PGPASSWORD=[password]
PGDATABASE=[database]
PGHOST=[host]
PGPORT=[port]

# Application Configuration
PORT=3001
NODE_ENV=development

# Session Configuration
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}

# Optional: OpenAI Configuration (if using AI features)
# OPENAI_API_KEY=your_api_key_here
`;

if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envTemplate);
    console.log('Created .env file template. Please update with your configuration values.');
} else {
    console.log('.env file already exists, skipping creation.');
}
