const { execSync } = require('child_process');

function checkDependency(command, name) {
    try {
        execSync(`command -v ${command}`, { stdio: 'ignore' });
        console.log(`✓ ${name} is installed`);
    } catch {
        console.error(`✗ ${name} is required but not installed`);
        process.exit(1);
    }
}

// Check required dependencies
checkDependency('node', 'Node.js');
checkDependency('yarn', 'Yarn');
checkDependency('python3', 'Python 3');
