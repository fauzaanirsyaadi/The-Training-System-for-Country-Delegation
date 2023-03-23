const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { User, Activity } = require('./model');

let userToken ;
let userProfile ;

// task description: For a board user register an user in the system, Just logged users with Board profile can realize this operation
// API endpoint to create a new user
router.post('/v1/user', (req, res) => {
  const token = req.query.token;

  console.log(this.userToken);
  console.log(userProfile);
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  } 

  if (userProfile !== 'board') {
    return res.status(401).json({ message: 'Unauthorized user : not board user' });
  }

  const { name, email, username, password, profile, skill } = req.body;
  if (!name || !email || !username || !password || !profile || !skill) {
    return res.status(422).json({ message: 'Data cannot be processed' });
  }
  const validProfiles = ['board', 'expert', 'trainer', 'competitor'];
  if (!validProfiles.includes(profile)) {
    return res.status(422).json({ message: 'Invalid profile' });
  }
  const newUser = new User({
    name,
    email,
    username,
    password,
    profile,
    skill,
  });
  newUser.save()
    .then(savedUser => res.status(200).json({ message: 'create success' }))
    .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});

// Login endpoint
router.post('/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(401).json({ message: 'Invalid login : username and password requirement' });
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid login : user is not exist' });
    }

    // Check if password is valid
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid login : wrong password' });
    }

    // Generate token and save to userToken
    this.userToken = jwt.sign({ id: user._id, profile: user.profile }, 'secret', { expiresIn: '1h' });
    
    userProfile = user.profile;
    // Return success response
    res.status(200).json({ token : this.userToken, profile: user.profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
  console.log(this.userToken);
  console.log(userProfile);
});

// Logout endpoint
router.get('/v1/auth/logout', (req, res) => {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  } 

  // Invalidate token (not implemented)
  userToken = undefined;
  userProfile = undefined;

  // Return success response
  res.status(200).json({ message: 'Logout success' });
});

// GET all user
router.get('/v1/user', (req, res) => {
  const token = req.query.token;

  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }
  User.find()
    .then(users => res.status(200).json(users))
    .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});

// GET user by profile
router.get('/v1/user/:profile', (req, res) => {
  const token = req.query.token;
  const profile = req.params.profile;

  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  User.find()
    .then(users => {
      const filteredUsers = users.filter(user => user.profile === profile);
      res.status(200).json(filteredUsers);
    })
    .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});

// GET user by skill
router.get('/v1/user/skill/:skill', (req, res) => {
  const token = req.query.token;
  const skill = req.params.skill;

  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  User.find()
    .then(users => {
      const filteredUsers = users.filter(user => user.skill === skill);
      res.status(200).json(filteredUsers);
    })
    .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});


// POST request to register a training activity
router.post('/v1/activity', function(req, res) {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  // Verify that the user has the correct profile to create an activity (expert)
  // if (userProfile !== 'expert') {
  //   return res.status(401).json({ message: 'Unauthorized user : not expert user' });
  // }

  // Validate request body
  const { skill, title, description, startdate, enddate, participants } = req.body;
  if (!participants) {
    return res.status(422).json({ message: 'Data cannot be processed ' });
  }

  // Validate that start date is before end date
  if (new Date(startdate) > new Date(enddate)) {
    return res.status(422).json({ message: 'Start date cannot be after end date' });
  }

  // check user skill of id of participants
  // participants.forEach(participant => {
  //   User.find()
  //   .then(users => {
  //     const filteredUsers = users.filter(user => user._id === participant.id);
  //     if (filteredUsers[0].skill !== skill) {
  //       return res.status(422).json({ message: 'participant must have same skill' });
  //     }
  //   })
  // });

  // Create the activity
  const skillactivity = skill
  const activity =  new Activity ({
    skillactivity,
    title,
    description,
    startdate,
    enddate,
    participants
  });
  activity.save()
    .then(activity => res.status(201).json({message : 'create success'}))
    .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});

// PUT request to update a training activity
router.put('/v1/activity/:id', async function(req, res) {
  // Verify that the user has a valid token
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  if (userProfile !== 'expert') {
    return res.status(401).json({ message: 'Unauthorized user : not expert user' });
  }

  // Find the activity by ID
  const id = req.params.id;
  const activity = db.activities.find(activity => activity.id === id);
  if (!activity) {
    return res.status(422).json({ message: 'Data cannot be processed' });
  }

  // Validate request body
  const { skill, title, description, startdate, enddate, participants } = req.body;
  // Check if required fields are not empty
  if (!skill || !title || !description || !startdate || !enddate || !participants) {
    return res.status(422).json({ message: 'Data cannot be processed' });
  }

  // Check if start date is before end date
  if (new Date(startdate) >= new Date(enddate)) {
    return res.status(422).json({ message: 'Start date must be before end date' });
  }

  // Check if participants have the same skill as the activity
  const participantsSkills = await Promise.all(participants.map(async (participantId) => {
    const user = await User.findById(participantId);
    return user.skill;
  }));
  if (!participantsSkills.every((pSkill) => pSkill === skill)) {
    return res.status(422).json({ message: 'Participants must have the same skill as the activity' });
  }

  try {
    const activity = new Activity({ skill, title, description, startdate, enddate, participants });
    const savedActivity = await activity.save();
    res.json({ message: 'Create success', data: savedActivity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an Activity
router.put('/:id', async (req, res) => {
  const { skill, title, description, startdate, enddate, participants } = req.body;

  // Check if required fields are not empty
  if (!skill || !title || !description || !startdate || !enddate || !participants) {
    return res.status(422).json({ message: 'Data cannot be processed' });
  }

  // Check if start date is before end date
  if (new Date(startdate) >= new Date(enddate)) {
    return res.status(422).json({ message: 'Start date must be before end date' });
  }

  // Check if participants have the same skill as the activity
  const participantsSkills = await Promise.all(participants.map(async (participantId) => {
    const user = await User.findById(participantId);
    return user.skill;
  }));
  if (!participantsSkills.every((pSkill) => pSkill === skill)) {
    return res.status(422).json({ message: 'Participants must have the same skill as the activity' });
  }

  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      { skill, title, description, startdate, enddate, participants },
      { new: true }
    );
    res.json({ message: 'Update success', data: updatedActivity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an Activity
router.delete('/:id', async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Delete success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List of Activities
router.get('/v1/activities/:skill_id', async (req, res) => {
  try {
    const { skill_id } = req.params;
    const { page, limit, sort_by, order_by } = req.query;
    const offset = (page - 1) * limit;

    // Get activities from the database
    const activities = await Activity.findAndPaginate(
      { skill_id },
      { offset, limit, sort_by, order_by }
    );

    // Map participants to each activity
    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        const participants = await User.find({ _id: { $in: activity.participants } });

        return {
          ...activity._doc,
          participants: participants.map(({ _id, name, profile, skills }) => ({
            id: _id,
            name,
            profile,
            skill: skills.find((skill) => skill._id.toString() === activity.skill_id.toString())
          }))
        };
      })
    );

    res.status(200).json(activitiesWithParticipants);
  } catch (error) {
    console.error(error);
    res.status(422).json({ message: 'Data cannot be processed' });
  }
});

// List skills endpoint
router.get('/v1/skills', async (req, res) => {
  try {
    // token
    const token = req.query.token;
    if (token !== userToken) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    // Find all skills
    const skills = await skills.find({});

    // Get activities for each skill
    const skillsWithActivities = await Promise.all(skills.map(async skill => {
      const activities = await Activity.find({ skill: skill._id });
      return {
        id: skill._id,
        skill_name: skill.skill_name,
        activities: activities.map(activity => activity._id)
      };
    }));

    // Return skills with activities as response
    res.status(200).json(skillsWithActivities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
