const jwt = require('jsonwebtoken');
const secret = process.env.SECRETKEY;

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  // console.log('token', token)
  if (!token) {
    return res.status(403).json({ message: 'Token is missing' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'You do not have access.' });
    } else {
      req.username = decoded.username;
      req.teamName = decoded.teamName;
      next();
    }
  });
};

module.exports = verifyToken;
