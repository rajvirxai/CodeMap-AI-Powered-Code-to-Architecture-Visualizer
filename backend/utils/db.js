const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codemap';

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🔌 Connected to MongoDB database successfully.');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB database:', err.message);
  });

// Schema representing the analysis results
const analysisSchema = new mongoose.Schema({
  folderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  repoTree: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  architecture: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = { mongoose, Analysis };
