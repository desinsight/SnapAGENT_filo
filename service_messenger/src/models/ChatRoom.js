// 채팅방 모델 (1:1, 그룹, 전체방 지원)
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * roomType: 'direct'(1:1), 'group'(그룹), 'org'(조직 전체)
 * name: 채팅방 이름(그룹/전체방)
 * members: [{ userId, role }]
 * isActive: 활성화 여부
 * createdAt, updatedAt: 생성/수정일
 */
const ChatRoomSchema = new Schema({
  roomType: { type: String, enum: ['direct', 'group', 'org'], required: true },
  name: { type: String },
  members: [
    {
      userId: { type: String, required: true }, // 플랫폼 사용자 ID
      role: { type: String, default: 'member' }, // 'admin', 'member' 등
    }
  ],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', ChatRoomSchema); 