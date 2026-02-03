const { successResponse, errorResponse } = require('../../utils/response');
const db = require('../../database/connection');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const { comparePassword } = require('../../utils/password');
const { success } = require('zod');

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists

    const sql = 'select * from userauthentication where email = ?';
    const results = await db.query(sql, [email]);

    if (results.length === 0) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }

    const user = results[0];

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid email or password'));
    }
    const sqlUser = 'select * from users where user_id = ?';
    const userResults = await db.query(sqlUser, [user.user_id]);
    if (userResults.length === 0) {
      res.status(401).json(errorResponse('User profile not found'));
      return;
    }
    const userProfile = userResults[0];

    const accessToken = generateAccessToken({
      id: userProfile.user_id,
      email: userProfile.email,
      user_name: userProfile.user_name,
      role: userProfile.user_role,
    });

    const refreshToken = await generateRefreshToken(user.user_id);

    //need to reviews
    const userInfo = {
      id: userProfile.user_id,
      email: userProfile.email,
      user_name: userProfile.user_name,
      role: userProfile.user_role,
      avatar: userProfile.avatar_link,
    };

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'Lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });
    res.status(200).json(
      successResponse('Login successful', {
        userInfo: userInfo,
        accessToken,
      })
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('An error occurred during login'));
  }
};

module.exports = login;
