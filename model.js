const mongoose = require('mongoose');

// User Model:
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: String, enum: ['board', 'expert', 'trainer', 'competitor'], required: true },
    skill: { type: String }
  }  
);

const activitySchema = new mongoose.Schema({
  skillactivity: {
    type: String,
    required: true
  }, 
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

// example request api participants
// {
//   "skillactivity": "surf",
//   "title": "Surfing in the morning",
//   "description": "Surfing in the morning",
//   "start_date": 20230323,
//   "end_date": 20230324,
//   "participants": [
//     "5f7f9b0b0b1b1b1b1b1b1b1b",
//     "5f7f9b0b0b1b1b1b1b1b1b1b"
//   ]
// }


// Export Models
module.exports.User = mongoose.model('User', userSchema);
module.exports.Activity = mongoose.model('Activity', activitySchema);
