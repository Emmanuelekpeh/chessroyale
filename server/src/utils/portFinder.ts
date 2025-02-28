import net from 'net';

/**
 * Finds an available port starting from the given port
 * @param startPort The port to start checking from
 * @returns A promise that resolves to an available port
 */
export const findAvailablePort = (startPort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next one
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
    
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
};

/**
 * Creates a port checker function that verifies if a port is available
 * @returns A function that checks if a port is available
 */
export const createPortChecker = () => {
  return (port: number): Promise<boolean> => {
    return new Promise(resolve => {
      const server = net.createServer();
      
      server.once('error', () => {
        resolve(false);
      });
      
      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });
      
      server.listen(port);
    });
  };
};
