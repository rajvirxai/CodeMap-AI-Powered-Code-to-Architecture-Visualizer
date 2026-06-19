const fs = require('fs');
const path = require('path');

// Dynamically require adm-zip from backend if it isn't in root
let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch (err) {
  // Fallback to backend node_modules
  const backendAdmZipPath = path.join(__dirname, 'backend', 'node_modules', 'adm-zip');
  AdmZip = require(backendAdmZipPath);
}

const tempDir = path.join(__dirname, 'temp-demo-project');
const outputZip = path.join(__dirname, 'frontend', 'public', 'demo-project.zip');

// Ensure frontend/public directory exists
const publicDir = path.dirname(outputZip);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create directory structure helper
function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 2. Create file helper
function createFile(filePath, content) {
  fs.writeFileSync(filePath, content.trim() + '\n');
}

console.log('📦 Creating mock demo project files...');

// Clean up any old temp dir
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

createDir(tempDir);
createDir(path.join(tempDir, 'src'));
createDir(path.join(tempDir, 'src', 'components'));
createDir(path.join(tempDir, 'src', 'controllers'));
createDir(path.join(tempDir, 'src', 'routes'));
createDir(path.join(tempDir, 'src', 'models'));
createDir(path.join(tempDir, 'src', 'services'));
createDir(path.join(tempDir, 'src', 'utils'));

// Add package.json
createFile(path.join(tempDir, 'package.json'), `{
  "name": "codemap-demo-codebase",
  "version": "1.0.0",
  "description": "Demo codebase for CodeMap architecture visualization",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5"
  }
}`);

// Add README.md
createFile(path.join(tempDir, 'README.md'), `# Demo Codebase
This is a standard demo project containing a client frontend, an Express REST API router, a business logic controllers layer, a database model layer, and a service layer.
Use it to test CodeMap visualizer!`);

// Add src/index.js
createFile(path.join(tempDir, 'src', 'index.js'), `
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { connectDB } = require('./utils/db');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/users', userRoutes);

app.listen(8080, () => {
  console.log('App running on port 8080');
});
`);

// Add src/components/Button.jsx
createFile(path.join(tempDir, 'src', 'components', 'Button.jsx'), `
import React from 'react';

export default function Button({ label, onClick }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onClick}>
      {label}
    </button>
  );
}
`);

// Add src/components/UserProfile.jsx
createFile(path.join(tempDir, 'src', 'components', 'UserProfile.jsx'), `
import React, { useEffect, useState } from 'react';
import { fetchUserData } from '../services/api';
import Button from './Button';

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserData(userId).then(data => setUser(data));
  }, [userId]);

  if (!user) return <div>Loading Profile...</div>;

  return (
    <div className="p-4 border rounded shadow">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button label="Refresh Profile" onClick={() => window.location.reload()} />
    </div>
  );
}
`);

// Add src/services/api.js
createFile(path.join(tempDir, 'src', 'services', 'api.js'), `
export async function fetchUserData(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  return response.json();
}
`);

// Add src/routes/userRoutes.js
createFile(path.join(tempDir, 'src', 'routes', 'userRoutes.js'), `
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/:id', userController.getUser);
router.post('/register', userController.registerUser);

module.exports = router;
`);

// Add src/controllers/userController.js
createFile(path.join(tempDir, 'src', 'controllers', 'userController.js'), `
const User = require('../models/User');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
`);

// Add src/models/User.js
createFile(path.join(tempDir, 'src', 'models', 'User.js'), `
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
`);

// Add src/utils/db.js
createFile(path.join(tempDir, 'src', 'utils', 'db.js'), `
const mongoose = require('mongoose');

exports.connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-db');
    console.log('MongoDB database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};
`);

console.log('📦 Compiling files into ZIP archive...');
const zip = new AdmZip();
zip.addLocalFolder(tempDir);
zip.writeZip(outputZip);

console.log('🧹 Cleaning up temporary directory...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`✅ Demo project ZIP generated at: ${outputZip}`);
