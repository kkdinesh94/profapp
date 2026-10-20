/**
 * Generates static JSON files from Work_Track.xlsx into public/data/
 * Run locally:  node scripts/generate-data.js
 * CI/CD:        called automatically by GitHub Actions on every push
 */
require('dotenv').config();
const { generateAllPublicJson } = require('../utils/excel');

try {
  generateAllPublicJson();
  console.log('Done.');
} catch (err) {
  console.error('Error generating data:', err.message);
  process.exit(1);
}
