const mongoose = require('mongoose');

// User Model:
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: String, enum: ['board', 'expert', 'trainer', 'competitor'], required: true },
  }  
);

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startdate: {
    type: Date,
    required: true
  },
  enddate: {
    type: Date,
    required: true
  },
  // participants (list of User ids (only list of users with the same skill), mandatory)
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
    validate: {
      validator: function(v) {
        return v.every(participant => participant.skill === this.skill);
      },
      message: 'All participants must have the same skill as the activity'
    }
  },
  
});

// skill model 
const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // activities (list of Activity ids, optional)
  activities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Activity'
  },
  // users (list of User ids, optional)
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  }
});


// Export Models
module.exports.User = mongoose.model('User', userSchema);
module.exports.Activity = mongoose.model('Activity', activitySchema);
module.exports.Skill = mongoose.model('Skill', skillSchema);
