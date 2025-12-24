import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Verify if user is admin
export const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: 'No email in token' });

    // Use regex 'i' flag to ignore case
    const user = await req.db.collection('users').findOne({ 
      email: { $regex: `^${email}$`, $options: 'i' } 
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying admin', error: error.message });
  }
};

// Verify if user is volunteer or admin
export const verifyVolunteerOrAdmin = async (req, res, next) => {
  try {
    const email = req.user.email;
    const user = await req.db.collection('users').findOne({ email });

    if (user?.role !== 'volunteer' && user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Volunteer or Admin only.' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying role', error: error.message });
  }
};