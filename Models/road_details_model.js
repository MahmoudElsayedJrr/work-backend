const mongoose = require("mongoose");

const roadDetailsSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Activity",
    required: true,
    unique: true,
  },
  petroleumCompany: {
    type: String,
    trim: true,
  },
  bitumenQuantity: {
    type: Number,
    min: 0,
  },
  mc: {
    type: Number,
    min: 0,
  },
  rc: {
    type: Number,
    min: 0,
  },
  remainingQuantitiesTons: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
});

const RoadDetails = mongoose.model("RoadDetails", roadDetailsSchema);
module.exports = RoadDetails;
