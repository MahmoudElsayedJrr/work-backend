const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    fiscalYear: {
      type: String,
      required: [true, "السنة المالية مطلوبة"],
      trim: true,
    },

    fundingType: {
      type: String,
      required: [true, "جهة التمويل مطلوبة"],
      enum: {
        values: ["خطة استثمارية", "تمويل الغير"],
        message:
          'نوع التمويل يجب أن يكون إما "خطة استثمارية" أو "تمويل الغير".',
      },
    },

    amount: {
      type: Number,
      required: [true, "قيمة المخصص المالي مطلوبة"],
      min: [0, "القيمة لازم تكون أكبر من أو تساوي صفر"],
    },
  },
  {
    timestamps: true,
  },
);

const Budget = mongoose.model("Budget", budgetSchema);

module.exports = Budget;
