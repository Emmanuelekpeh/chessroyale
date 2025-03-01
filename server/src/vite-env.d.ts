// Allow importing config file outside of src directory
declare module '../config' {
  interface ServerConfig {
    port: number;
    host: string;
    timeout: number;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  }

  interface Config {
    server: ServerConfig;
    // Add other config properties as needed
  }

  const config: Config;
  export default config;
}

// Allow importing vite config file
declare module '../vite.config.mts' {
  import { UserConfig } from 'vite';
  const config: UserConfig;
  export default config;
}
