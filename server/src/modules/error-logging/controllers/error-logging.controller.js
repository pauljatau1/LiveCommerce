
const ErrorLog = require('../../../models/ErrorLog');

exports.getErrors = async (req, res) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 });
    res.status(200).json({ errors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch error logs', error: error.message });
  }
};
