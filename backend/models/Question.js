import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [20, 'Description must be at least 20 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
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
  views: {
    type: Number,
    default: 0
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'duplicate', 'off-topic'],
    default: 'open'
  },
  bounty: {
    amount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for answer count
questionSchema.virtual('answerCount', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'question',
  count: true
});

// Virtual for accepted answer
questionSchema.virtual('acceptedAnswer', {
  ref: 'Answer',
  localField: '_id',
  foreignField: 'question',
  justOne: true,
  match: { isAccepted: true }
});

// Indexes for better query performance
questionSchema.index({ title: 'text', description: 'text' });
questionSchema.index({ tags: 1 });
questionSchema.index({ author: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ lastActivity: -1 });
questionSchema.index({ 'votes.upvotes': 1 });
questionSchema.index({ 'votes.downvotes': 1 });

// Method to update last activity
questionSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to add view
questionSchema.methods.addView = function() {
  this.views += 1;
  return this.save();
};

// Method to check if user has voted
questionSchema.methods.hasUserVoted = function(userId, voteType) {
  if (voteType === 'upvote') {
    return this.votes.upvotes.some(vote => vote.user.toString() === userId.toString());
  } else if (voteType === 'downvote') {
    return this.votes.downvotes.some(vote => vote.user.toString() === userId.toString());
  }
  return false;
};

// Method to add vote
questionSchema.methods.addVote = function(userId, voteType) {
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
questionSchema.methods.removeVote = function(userId, voteType) {
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

const Question = mongoose.model('Question', questionSchema);

export default Question; 