// 게시글 모델 (공지/일반글, 파일첨부, 댓글 등 지원)
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * board: 게시판 참조
 * author: 작성자(플랫폼 사용자 ID)
 * title: 제목
 * content: 내용
 * isNotice: 공지글 여부
 * files: 첨부파일 메타데이터 배열
 * comments: 댓글 ObjectId 배열
 * createdAt, updatedAt: 생성/수정일
 */
const PostSchema = new Schema({
  board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  author: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  isNotice: { type: Boolean, default: false },
  files: [
    {
      fileId: String,
      fileName: String,
      fileSize: Number,
      fileType: String,
    }
  ],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema); 