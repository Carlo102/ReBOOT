const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false 
  },
  role: {
    type: String,
    default: 'Frontend Developer',
    trim: true
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  profileComplete: {
    type: Number,
    default: 50
  },
  skillsCount: {
    type: Number,
    default: 0
  },
  yearsExperience: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  coursesCompleted: [{
    courseName: String,
    completedAt: Date,
    xpEarned: Number
  }],
  challengesCompleted: [{
    challengeId: String,
    completedAt: Date,
    xpEarned: Number
  }],
  lastChallengeDate: {
    type: Date,
    default: null
  },
  careerInterests: [{
    type: String
  }],
  upskillProgress: {
    totalCourses: {type: Number, default: 0},
    totalChallenges: {type: Number, default: 0},
    resourcesAccessed: {type: Number, default: 0}
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }
  
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
};

userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
};

module.exports = mongoose.model('User', userSchema)