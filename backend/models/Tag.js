import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [2, 'Tag name must be at least 2 characters'],
    maxlength: [30, 'Tag name cannot exceed 30 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Tag description cannot exceed 500 characters']
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  synonyms: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
tagSchema.index({ name: 1 });
tagSchema.index({ usageCount: -1 });
tagSchema.index({ lastUsed: -1 });
tagSchema.index({ synonyms: 1 });

// Method to increment usage count
tagSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Method to decrement usage count
tagSchema.methods.decrementUsage = function() {
  if (this.usageCount > 0) {
    this.usageCount -= 1;
  }
  return this.save();
};

// Static method to find or create tag
tagSchema.statics.findOrCreate = async function(tagName) {
  let tag = await this.findOne({ name: tagName.toLowerCase() });
  
  if (!tag) {
    tag = await this.create({
      name: tagName.toLowerCase(),
      usageCount: 1
    });
  } else {
    await tag.incrementUsage();
  }
  
  return tag;
};

// Static method to get popular tags
tagSchema.statics.getPopularTags = function(limit = 20) {
  return this.find({ isModerated: false })
    .sort({ usageCount: -1, lastUsed: -1 })
    .limit(limit)
    .select('name description usageCount');
};

// Static method to search tags
tagSchema.statics.searchTags = function(query, limit = 10) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { synonyms: { $regex: query, $options: 'i' } }
    ]
  })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name description usageCount');
};

const Tag = mongoose.model('Tag', tagSchema);

export default Tag; 