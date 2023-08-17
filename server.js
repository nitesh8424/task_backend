// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;


const app = express();
const PORT = process.env.PORT;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DATABASE;
const secret = process.env.SECRETKEY;

const mongoURI = `mongodb+srv://${username}:${password}@cluster0.uttybej.mongodb.net/${database}?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


const imageSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  keywords: [String],
  imageUrl: String,
  width: String,
  height : String,
  teamName : String,
  tag : String,
  uploadDate: { type: Date, default: Date.now } 
});

const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  password: String,
  teamName: String,
  createdAt: { type: Date, default: Date.now } 
});

const Image = mongoose.model('images', imageSchema);
const User = mongoose.model('users', userSchema);


app.use(express.json());
app.use(cors());

const verifyToken = (req, res, next) => {
	console.log('req.head', req.headers)
  const token = req.headers.authorization.split(" ")[1];
 // console.log('token',token)
  if (!token) {
    return res.status(403).json({ message: 'Token is missing' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({message : 'You do not have access.'});
    } else {
      req.username = decoded.username;
      req.teamName = decoded.teamName;
      next();
    }
  });
};

app.use('/uploads', express.static('uploads'))

const upload = multer({ dest: 'uploads/' });

app.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, keywords, width, height, teamName, tag } = req.body;
    const imageUrl = req.file.path;
    const uniqueId = uuidv4();
    const image = new Image({
      id: uniqueId,
      title,
      description,
      keywords,
      imageUrl,
      width: parseInt(width),   
      height: parseInt(height), 
      teamName,  
      tag
    }); 
    console.log('images', image)
    await image.save();
    res.status(200).json({ message: 'Image uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while uploading the image' });
  }
});


app.post('/register', async (req, res) => {
  try {
    const { username, password, teamName } = req.body;
    const uniqueId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const user = new User({
      id: uniqueId,
      username,
      password: hashedPassword, // Store the hashed password
      teamName,
    });
    const getUser = await User.findOne({ username });
    if(!getUser)
    {
       await user.save();
       res.status(200).json({ message: 'User registered successfully' });
    }else{
        res.status(401).json({message : 'user already registered'})
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    const teamName = user.teamName;
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ username, teamName: teamName }, secret, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token , user: {username, teamName} });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});



app.get('/search', async (req, res) => {
  try {
    console.log('req', req.query);
    const keyword = req.query.keyword || '';
    const date = req.query.date || '';
    const teamName = req.query.teamName || '';
    const width = parseInt(req.query.width) || null;
    const height = parseInt(req.query.height) || null;
    const color = req.query.color || ''; 
    const sortBy = req.query.sortBy || ''; //optional add here
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1; //optional add
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const keywordRegex = new RegExp(keyword, 'i');
    console.log('teamName', teamName)
    const matchCriteria = {
  keywords: keywordRegex,
  title: keywordRegex,
  teamName: teamName, // Include teamName condition directly
};

if (width && height) {
  matchCriteria.width = width;
  matchCriteria.height = height;
}

if (color) {
  matchCriteria.color = color;
}

const aggregationPipeline = [];

if (date) {
  aggregationPipeline.push(
    {
      $match: {
        uploadDate: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        },
        ...matchCriteria,
      },
    }
  );
} else {
  aggregationPipeline.push({ $match: matchCriteria });
}

if (sortBy) {
  aggregationPipeline.push({ $sort: { [sortBy]: sortOrder } });
}

const images = await Image.aggregate(aggregationPipeline)
  .skip((page - 1) * perPage)
  .limit(perPage);

res.json({ images });

  } catch (error) {
    console.error('Error during database query:', error);
    res.status(500).json({ message: 'An error occurred while fetching search results' });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
