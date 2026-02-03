const { successResponse, errorResponse } = require('../../utils/response');
const db = require('../../database/connection');
const { generateAccessToken } = require('../../utils/jwt');

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json(errorResponse('No refresh token provided'));
    }
    const sql = 'select * from refresh_tokens where token = ?';
    const results = await db.query(sql, [refreshToken]);

    if (results.length === 0) {
      res.status(401).json(errorResponse('Invalid refresh token'));
      return;
    }

    const tokenRecord = results[0];

    // Check if refresh token is expired
    if (new Date() > new Date(tokenRecord.expires_At)) {
      res.status(401).json(errorResponse('Refresh token has expired'));
      return;
    }

    // Fetch user details
    const sqlUser = 'select * from users where user_id = ?';
    const userResults = await db.query(sqlUser, [tokenRecord.user_id]);
    if (userResults.length === 0) {
      res.status(401).json(errorResponse('User not found'));
      return;
    }
    const userProfile = userResults[0];

    const userInfo = {
      id: userProfile.user_id,
      email: userProfile.email,
      user_name: userProfile.user_name,
      role: userProfile.user_role,
      avatar: userProfile.avatar_link,
    };

    const newAccessToken = generateAccessToken({
      id: userProfile.user_id,
      email: userProfile.email,
      user_name: userProfile.user_name,
      role: userProfile.user_role,
    });

    res.status(200).json(
      successResponse(
        {
          accessToken: newAccessToken,
          user: userInfo,
        },
        'Token refreshed successfully',
      )
    );
  }catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
}
module.exports = refresh

