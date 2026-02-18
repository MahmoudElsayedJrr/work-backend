const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم الاستشاري مطلوب"],
      unique: true,
      trim: true,
      minlength: [2, "اسم الاستشاري يجب أن يكون على الأقل حرفين"],
      maxlength: [100, "اسم الاستشاري يجب ألا يتجاوز 100 حرف"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

consultantSchema.index({ createdAt: -1 });

consultantSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

const Consultant = mongoose.model("Consultant", consultantSchema);

module.exports = Consultant;
