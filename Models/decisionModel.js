/* const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema(
  {

    decisionName: {
      type: String,
      required: [true, "اسم البند مطلوب"],
      trim: true,
    },
    decisionType: {
      type: String,
      required: [true, "نوع البند مطلوب"],
      trim: true,
      enum: {
        values: ["تعاقدي", "مستجد", "متجاوز"],
        message: 'نوع البند يجب أن يكون "تعاقدي" أو "مستجد" أو "متجاوز".',
      },
    },
    decisionQuantity: {
      type: Number,
      required: [true, "الكمية مطلوبة"],
      min: [0, "الكمية يجب أن تكون صفر أو أكثر"],
      default: 0,
    },
    decisionUnit: {
      type: String,
      required: [true, "وحدة القياس مطلوبة"],
      trim: true,
    },
    decisionPrice: {
      type: Number,
      required: [true, "السعر مطلوب"],
      min: [0, "السعر يجب أن يكون صفر أو أكثر"],
      default: 0,
    },
    decisionTotal: {
      type: Number,
      min: [0, "الإجمالي يجب أن يكون صفر أو أكثر"],
      default: 0,
    },
  },
  {
    timestamps: true, 
  }
);

// Index مركب للبحث السريع
decisionSchema.index({ activityId: 1, activityCode: 1 });

// Middleware قبل الحفظ لحساب الإجمالي تلقائياً
decisionSchema.pre("save", function (next) {
  if (this.decisionQuantity !== undefined && this.decisionPrice !== undefined) {
    this.decisionTotal = this.decisionQuantity * this.decisionPrice;
  }
  next();
});

// Middleware قبل التحديث لحساب الإجمالي تلقائياً
decisionSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    const quantity = update.$set.decisionQuantity;
    const price = update.$set.decisionPrice;
    
    if (quantity !== undefined && price !== undefined) {
      update.$set.decisionTotal = quantity * price;
    }
  }
  next();
});

const DecisionModel = mongoose.model("Decision", decisionSchema);

module.exports = DecisionModel; */
