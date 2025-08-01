// 게시판 모델 (자유/공지, 공개/비공개 지원)
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * boardType: 'free'(자유), 'notice'(공지)
 * name: 게시판 이름
 * description: 설명
 * isPublic: 공개 여부
 * members: 비공개 게시판 멤버 [{ userId, role }]
 * createdAt, updatedAt: 생성/수정일
 */
const BoardSchema = new Schema({
  boardType: { type: String, enum: ['free', 'notice'], required: true },
  name: { type: String, required: true },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  members: [
    {
      userId: { type: String, required: true },
      role: { type: String, default: 'member' },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema); 