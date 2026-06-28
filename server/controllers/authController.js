import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_dev_key_12345', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email and password' });
  }

  try {
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
    });

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarColor: user.avatarColor,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = code;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    console.log(`[OTP LOGIN] Code for ${email}: ${code}`);

    return res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Please provide email and OTP' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp === otp && user.otpExpires && user.otpExpires > new Date()) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();

      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarColor: user.avatarColor,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  if (req.user) {
    return res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatarColor: req.user.avatarColor,
    });
  } else {
    return res.status(404).json({ message: 'User not found' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.username) {
      // Check if username is already taken by someone else
      if (req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
      }
      user.username = req.body.username;
    }

    if (req.body.email) {
      const emailLower = req.body.email.toLowerCase();
      if (emailLower !== user.email) {
        const emailExists = await User.findOne({ email: emailLower });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already registered' });
        }
      }
      user.email = emailLower;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.body.avatarColor) {
      user.avatarColor = req.body.avatarColor;
    }

    const updatedUser = await user.save();
    return res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarColor: updatedUser.avatarColor,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

