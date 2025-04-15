
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/driving_exam';

const [,, username, password] = process.argv;

if (!username || !password) {
  console.log('Usage: node seed.js <username> <password>');
  process.exit(1);
}

async function createUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log('✅ User created:', username);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating user:', err.message);
    process.exit(1);
  }
}

createUser();
