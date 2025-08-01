import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.js';

const MONGO_URI = 'mongodb://localhost:27017/filo';

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const email = 'admin@filo.com';
  const name = '관리자';
  const password = 'admin1234';
  const hash = await bcrypt.hash(password, 10);
  const role = 'admin';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('이미 존재하는 관리자 계정입니다.');
    await mongoose.disconnect();
    return;
  }

  await User.create({ email, name, password: hash, role });
  console.log('관리자 계정 생성 완료!');
  await mongoose.disconnect();
}

createAdmin(); 