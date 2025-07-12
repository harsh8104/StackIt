import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    minlength: [10, 'Answer must be at least 10 characters']
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Indexes for better query performance
answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ author: 1 });
answerSchema.index({ isAccepted: 1 });
answerSchema.index({ 'votes.upvotes': 1 });
answerSchema.index({ 'votes.downvotes': 1 });

// Method to check if user has voted
answerSchema.methods.hasUserVoted = function(userId, voteType) {
  if (voteType === 'upvote') {
    return this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  } else if (voteType === 'downvote') {
    return this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  }
  return false;
};

// Method to add vote
answerSchema.methods.addVote = function(userId, voteType) {
  if (voteType === 'upvote') {
    // Remove from downvotes if exists
    this.votes.downvotes = this.votes.downvotes.filter(
      vote => vote.user.toString() !== userId.toString()
    );
    
    // Add to upvotes if not already voted
    if (!this.hasUserVoted(userId, 'upvote')) {
      this.votes.upvotes.push({ user: userId });
    }
  } else if (voteType === 'downvote') {
    // Remove from upvotes if exists
    this.votes.upvotes = this.votes.upvotes.filter(
      vote => vote.user.toString() !== userId.toString()
    );
    
    // Add to downvotes if not already voted
    if (!this.hasUserVoted(userId, 'downvote')) {
      this.votes.downvotes.push({ user: userId });
    }
  }
  
  return this.save();
};

// Method to remove vote
answerSchema.methods.removeVote = function(userId, voteType) {
  if (voteType === 'upvote') {
    this.votes.upvotes = this.votes.upvotes.filter(
      vote => vote.user.toString() !== userId.toString()
    );
  } else if (voteType === 'downvote') {
    this.votes.downvotes = this.votes.downvotes.filter(
      vote => vote.user.toString() !== userId.toString()
    );
  }
  
  return this.save();
};

// Method to accept answer
answerSchema.methods.acceptAnswer = async function() {
  // First, unaccept all other answers for this question
  const Answer = mongoose.model('Answer');
  await Answer.updateMany(
    { question: this.question, _id: { $ne: this._id } },
    { isAccepted: false }
  );
  
  // Accept this answer
  this.isAccepted = true;
  return this.save();
};

// Method to add comment
answerSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    content,
    author: userId
  });
  return this.save();
};

// Method to edit answer
answerSchema.methods.editAnswer = function(newContent, editedBy) {
  // Save current content to edit history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
    editedBy: editedBy
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  
  return this.save();
};

const Answer = mongoose.model('Answer', answerSchema);

export default Answer; 