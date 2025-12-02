const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model("Consultant", consultantSchema);
