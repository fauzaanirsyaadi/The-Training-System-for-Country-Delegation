const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { User, Activity, Skill } = require('./model');

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
  });
  const newSkill = new Skill({
    name: skill,
    users: newUser._id,
  });
  newSkill.save();
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
    const user = await User.findOne({ username }).exec();

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

// POST request to register a training activity
router.post('/v1/activity', function(req, res) {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  // only expert can create activity
  if (userProfile !== 'expert') {
    return res.status(401).json({ message: 'Unauthorized user : not expert user' });
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

  const userSkills = [];
  // loop participants
  for (let i = 0; i < participants.length; i++) {
    // find skill of each participant
    const userSkill = Skill.find({ users: participants[i] });
    userSkills.push(userSkill);
  }
  // check if skill of each participant is the same as the skill of the activity
  if (userSkills.includes(skill)) {
    return res.status(422).json({ message: 'Skill of each participant is not the same as the skill of the activity' });
  }

  const user_id = participants
  const activity =  new Activity ({
    title,
    description,
    startdate,
    enddate,
    participants
  });
  const newSkill = new Skill({
    name: skill,
    users: user_id,
    activities: activity._id
  });
  newSkill.save();
  activity.save()
  .then(activity => res.status(201).json({message : 'create success'}))
  .catch(err => res.status(422).json({ message: 'Data cannot be processed' }));
});

// PUT request to update a activity
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
  const activity = await Activity.findById(id);
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

  const userSkills = [];
  // loop participants
  for (let i = 0; i < participants.length; i++) {
    // find skill of each participant
    const userSkill = Skill.find({ users: participants[i] });
    userSkills.push(userSkill);
  }
  // check if skill of each participant is the same as the skill of the activity
  if (userSkills.includes(skill)) {
    return res.status(422).json({ message: 'Skill of each participant is not the same as the skill of the activity' });
  }
  const user_id = participants
  try {
    const newSkill = new Skill({
      name: skill,
      users: user_id,
      activities: activity._id
    });
    newSkill.save();
    const activity = new Activity({ title, description, startdate, enddate, participants });
    const savedActivity = await activity.save();
    res.json({ message: 'update success', data: savedActivity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an Activity
router.delete('/v1/activity/:id', async (req, res) => {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  if (userProfile !== 'expert') {
    return res.status(401).json({ message: 'Unauthorized user : not expert user' });
  }

  try {
    await Skill.findOneAndDelete(req.params.id);
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Delete success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List of Activities 
router.get('/v1/activities/:id', async (req, res) => {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }
  
  try {
    // res.json(activitiesData);
    const skill = await Skill.findById(req.params.id);
    
    // get all activities data from skill activities
    const activities = skill.activities;
    const Data = [];
    Data.push({"skill_id" : skill._id, "skill_name" : skill.name});
    for (let i = 0; i < activities.length; i++) {
      const activity = await Activity.findById(activities[i]);
      Data.push(activity);
    }
    // get all user data from skill users
    const users = skill.users;
    for (let i = 0; i < users.length; i++) {
      const user = await User.findById(users[i]);
      Data.push(user);
    }
    res.status(200).json(Data);
  } catch (error) {
    console.error(error);
    res.status(422).json({ message: 'Data cannot be processed' });
  }
});

// Get all skills
router.get('/v1/skills', async (req, res) => {
  const token = req.query.token;
  
  if (token !== userToken) {
    return res.status(401).json({ message: 'Unauthorized user' });
  }

  try {
    const skills = await Skill.find();
    res.status(200).json(skills);
  } catch (error) {
    console.error(error);
    res.status(422).json({ message: 'Data cannot be processed' });
  }
});

module.exports = router;
