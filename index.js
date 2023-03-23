require('dotenv').config();

const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString,{ useNewUrlParser: true, useUnifiedTopology: true});
const database = mongoose.connection;

database.on('error', (error) => console.error(error));
database.once('open', () => console.log('Connected to database'));

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(cors())
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const authRoutes = require('./route');
// Routes
app.use(authRoutes);


// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server Started at ${port}`)
})
