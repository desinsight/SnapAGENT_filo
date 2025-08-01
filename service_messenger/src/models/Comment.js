// 댓글 모델 (게시글/대댓글 지원)
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * post: 게시글 참조
 * author: 작성자(플랫폼 사용자 ID)
 * content: 댓글 내용
 * parent: 부모 댓글(대댓글용, null이면 최상위)
 * createdAt, updatedAt: 생성/수정일
 */
const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema); 