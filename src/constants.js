const path = require('node:path');     // for getting directory paths

module.exports = {
  PORT: 3000,              // default port we'll listen on
  STORAGE_PATH: path.join(__dirname, '../storage'),
  APP_NAME: "STORAGE-API"  // just used for logging  
}