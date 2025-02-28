import { createServer } from 'net';

interface PortResult {
  port: number;
  success: boolean;
  error?: string;
}

function findFreePort(startPort: number = 3000, endPort: number = 65535): Promise<PortResult> {
  return new Promise((resolve) => {
    const server = createServer();

    const tryPort = (port: number) => {
      server.once('error', () => {
        if (port < endPort) {
          tryPort(port + 1);
        } else {
          resolve({
            port: startPort,
            success: false,
            error: 'No free port found in range'
          });
        }
      });

      server.once('listening', () => {
        server.close(() => {
          resolve({
            port,
            success: true
          });
        });
      });

      server.listen(port, '0.0.0.0');
    };

    tryPort(startPort);
  });
}

// For CLI usage
if (require.main === module) {
  const [,, start, end] = process.argv;
  const startPort = parseInt(start) || 3000;
  const endPort = parseInt(end) || 65535;

  findFreePort(startPort, endPort)
    .then((result) => {
      console.log(JSON.stringify({
        port: result.port,
        status: result.success ? 'success' : 'error',
        ...(result.error && { error: result.error })
      }));
    });
}

export { findFreePort };
