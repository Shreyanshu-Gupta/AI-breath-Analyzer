require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const History = require('./models/History');
const dbURL=process.env.MONGO_URI;
const app = express();
app.use(cors());
app.use(express.json());

// Hardcoded for demo/dev if not in .env
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-jwt-secret-key-123!';

// Connect to MongoDB
mongoose.connect(dbURL)
  .then(() => console.log("Connected to MongoDB BreathAI Database"))
  .catch((err) => console.error("MongoDB connection error:", err));

// --- Middleware ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // { id, email }
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// --- Public Auth Routes ---

app.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, age, gender, smokingStatus, alcoholConsumption } = req.body;

    if (!fullName || !email || !password || !age || !gender || !smokingStatus || !alcoholConsumption) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName, email, password_hash, age, gender, smokingStatus, alcoholConsumption
    });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userToReturn = {
      name: user.fullName,
      email: user.email,
      age: user.age,
      smokingStatus: user.smokingStatus,
      alcoholConsumption: user.alcoholConsumption
    };

    res.json({ success: true, token, message: 'Login successful.', user: userToReturn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// --- Protected ML & History Routes ---

app.post('/predict', verifyToken, async (req, res) => {
  try {
    const { mq3, mq135, mq138, temp, humidity, pressure, spo2, hr } = req.body;

    const flaskPayload = { mq3, mq135, mq138, temp, humidity, pressure, spo2, hr };
    
    let predictionValue = 0; 
    let predictionText = "Healthy Profile";

    try {
      const flaskResponse = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flaskPayload)
      });
      
      const flaskData = await flaskResponse.json();
      predictionValue = Number(flaskData.prediction);
      
      if (predictionValue === 0) predictionText = "Healthy Profile";
      else if (predictionValue === 1) predictionText = "Mild Irregularity Detected";
      else predictionText = "Significant Irregularity";
    } catch(err) {
      console.warn("Flask server unreachable, using fallback prediction.", err.message);
    }

    // Use req.user (from JWT)
    const newHistory = new History({
      user_email: req.user.email,
      features: Object.values(flaskPayload),
      prediction: predictionText,
      values: { spo2, hr },
      timestamp: new Date().toLocaleString()
    });
    
    await newHistory.save();

    res.json({ success: true, prediction: predictionValue, prediction_text: predictionText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error processing prediction.' });
  }
});

app.get('/history', verifyToken, async (req, res) => {
  try {
    // Only fetch history for the verified logged in user
    const history = await History.find({ user_email: req.user.email }).sort({ _id: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching history.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`MERN Auth & History API running on http://127.0.0.1:${PORT}`);
});
