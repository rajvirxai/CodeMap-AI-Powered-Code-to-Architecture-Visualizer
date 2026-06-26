const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codemap';

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🔌 Connected to MongoDB database successfully.');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB database.');
    console.error('   Name:', err.name);
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    if (err.reason) {
      console.error('   Reason:', err.reason);
    }
    console.warn('⚠️ Server is running in OFFLINE MODE (Database writes will be skipped).');
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
