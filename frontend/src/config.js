// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: 'http://localhost:4000',
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://your-railway-app.railway.app',
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate configuration
export default config[environment]; 