const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB...");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1); // stop the server if db connection fails
  }
};

module.exports = connectDB;
