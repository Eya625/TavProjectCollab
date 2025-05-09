const ActionHistory = require('../models/ActionHistory');

exports.getActionHistory = async (req, res) => {
  try {
    const actions = await ActionHistory.find().sort({ timestamp: -1 });
    res.status(200).json(actions);
  } catch (error) {
    console.error("Error retrieving action history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.clearActionHistory = async (req, res) => {
  try {
    await ActionHistory.deleteMany({});
    res.status(200).json({ message: 'Action history cleared successfully' });
  } catch (error) {
    console.error("Error clearing action history:", error);
    res.status(500).json({ error: 'Error clearing action history', details: error });
  }
};
