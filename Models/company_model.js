const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم الشركة مطلوب"],
      unique: true,
      trim: true,
      minlength: [2, "اسم الشركة يجب أن يكون على الأقل حرفين"],
      maxlength: [150, "اسم الشركة يجب ألا يتجاوز 150 حرف"],
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
  }
);

// Index for better search performance
companySchema.index({ name: 1 });
companySchema.index({ createdAt: -1 });

// Pre-save middleware to trim name
companySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
