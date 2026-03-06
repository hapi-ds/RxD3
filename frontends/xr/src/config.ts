/**
 * Configuration management for the XR frontend
 * Loads and validates environment variables from Vite
 */

/**
 * Application configuration interface
 */
interface Config {
  apiUrl: string;
  wsUrl: string;
}

/**
 * Validates that a required environment variable is present
 * @param value - The environment variable value
 * @param name - The name of the environment variable
 * @returns The validated value
 * @throws Error if the value is undefined or empty
 */
function validateEnvVar(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Load and validate configuration from environment variables
 * @returns Validated configuration object
 */
function loadConfig(): Config {
  // Vite exposes env vars prefixed with VITE_ via import.meta.env
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;

  return {
    apiUrl: validateEnvVar(apiUrl, 'VITE_API_URL'),
    wsUrl: validateEnvVar(wsUrl, 'VITE_WS_URL'),
  };
}

/**
 * Application configuration singleton
 * Loaded once at module initialization
 */
export const config: Config = loadConfig();

/**
 * Export individual config values for convenience
 */
export const { apiUrl, wsUrl } = config;
