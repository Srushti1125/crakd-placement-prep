import app from './app.js';
import { initializeDatabase } from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize Database, then start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error(' Failed to initialize database and start server:', err);
});