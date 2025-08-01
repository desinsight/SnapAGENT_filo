// 메시지 모델 (텍스트, 파일, 이모지 등 지원)
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * chatRoom: 채팅방 참조
 * sender: 보낸 사람(플랫폼 사용자 ID)
 * content: 메시지 내용
 * type: 'text', 'file', 'emoji' 등
 * files: 첨부파일 메타데이터 배열
 * readBy: [{ userId, readAt }]
 * createdAt: 생성일
 */
const MessageSchema = new Schema({
  chatRoom: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender: { type: String, required: true }, // 플랫폼 사용자 ID
  content: { type: String },
  type: { type: String, enum: ['text', 'file', 'emoji'], default: 'text' },
  files: [
    {
      fileId: String, // 외부 파일 서비스 연동용
      fileName: String,
      fileSize: Number,
      fileType: String,
    }
  ],
  readBy: [
    {
      userId: String,
      readAt: Date,
    }
  ],
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Message', MessageSchema); 