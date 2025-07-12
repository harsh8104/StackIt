import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['answer', 'vote', 'mention', 'comment', 'accept'],
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    voteType: String, // 'upvote' or 'downvote' for vote notifications
    questionTitle: String, // Store question title for quick access
    answerPreview: String // Store answer preview for quick access
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Virtual for formatted message
notificationSchema.virtual('message').get(function() {
  switch (this.type) {
    case 'answer':
      return `${this.sender.username} answered your question "${this.metadata.questionTitle}"`;
    case 'vote':
      const voteAction = this.metadata.voteType === 'upvote' ? 'upvoted' : 'downvoted';
      return `${this.sender.username} ${voteAction} your ${this.answer ? 'answer' : 'question'}`;
    case 'mention':
      return `${this.sender.username} mentioned you in a comment`;
    case 'comment':
      return `${this.sender.username} commented on your ${this.answer ? 'answer' : 'question'}`;
    case 'accept':
      return `${this.sender.username} accepted your answer`;
    default:
      return this.content;
  }
});

// Ensure virtuals are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(recipientId, notificationIds) {
  const filter = { recipient: recipientId };
  if (notificationIds && notificationIds.length > 0) {
    filter._id = { $in: notificationIds };
  }
  
  return await this.updateMany(filter, { read: true });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return await this.countDocuments({ recipient: recipientId, read: false });
};

export default mongoose.model('Notification', notificationSchema); 