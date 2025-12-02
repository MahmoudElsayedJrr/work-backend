const mongoose = require("mongoose");

const governorateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model("Governorate", governorateSchema);
