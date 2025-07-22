const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    activityCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    activityName: {
      type: String,
      required: [true, "اسم النشاط مطلوب."],
      trim: true,
    },
    activityDescription: {
      type: String,
      trim: true,
      default: "",
    },
    governorate: {
      type: String,
      enum: {
        values: [
          "شمال سيناء",
          "جنوب سيناء",
          "بورسعيد",
          "الاسماعيلية",
          "السويس",
          "الشرقية",
          "دمياط",
        ],
        message: "القيمة المدخلة للمحافظة غير صالحة.",
      },
    },
    fundingType: {
      type: String,

      enum: {
        values: ["خطة استثمارية", "تمويل الغير"],
        message:
          'نوع التمويل يجب أن يكون إما "خطة استثمارية" أو "تمويل الغير".',
      },
    },
    projectCategory: {
      type: String,

      enum: {
        values: [
          "طرق",
          "كهرباء",
          "مياه",
          "صرف صحي",
          "اسكان بدوي",
          "اسكان اجتماعي",
          "خدمات",
          "تنمية متكاملة",
          "حضانات",
          "مجازر",
          "تأهيل مباني حكومية",
          "آخر",
        ],
        message: "فئة المشروع المدخلة غير صالحة.",
      },
    },

    status: {
      //حاله النشاط
      type: String,
      enum: ["قيد التنفيذ", "مكتمل", "متأخر"],
      default: "قيد التنفيذ",
    },

    executingCompany: {
      // الشركة المنفذة
      type: String,
      trim: true,
    },
    consultant: {
      // الاستشاري
      type: String,
      trim: true,
      default: "N/A",
    },
    estimatedValue: {
      // قيمة تقديرية
      type: Number,
      min: [0, "القيمة التقديرية يجب أن تكون أكبر من أو تساوي صفر."],
      default: 0,
    },
    contractualValue: {
      // قيمة تعاقدية
      type: Number,
      min: [0, "القيمة التعاقدية يجب أن تكون أكبر من أو تساوي صفر."],
      default: 0,
    },
    disbursedAmount: {
      // المنصرف
      type: Number,
      min: [0, "المبلغ المنصرف يجب أن يكون أكبر من أو يساوي صفر."],
      default: 0,
    },
    undisbursedAmount: {
      // لم يتم صرفه
      type: Number,
      min: [0, "المبلغ غير المصروف يجب أن يكون أكبر من أو يساوي صفر."],
      default: 0,
    },
    assignmentDate: {
      // تاريخ الاسناد
      type: Date,
      default: null,
    },
    completionDate: {
      // تاريخ النهو
      type: Date,
      default: null,
    },
    receptionDate: {
      // تاريخ الاستلام
      type: Date,
      default: null,
    },

    publishDate: {
      // تاريخ النشر
      type: Date,
      default: null,
    },

    technicalDecisionDate: {
      // تاريخ البت الفني
      type: Date,
      default: null,
    },

    financialDecisionDate: {
      // تاريخ البت المالي
      type: Date,
      default: null,
    },

    assignmentOrderDate: {
      // تاريخ امر الاسناد
      type: Date,
      default: null,
    },

    siteHandoverDate: {
      // تاريخ تسليم الموقع
      type: Date,
      default: null,
    },

    contractualDocuments: [
      {
        filename: String,
        path: String,
      },
    ],

    progress: {
      type: Number,
      min: [0, "نسبة الإنجاز يجب أن تكون بين 0 و 100."],
      max: [100, "نسبة الإنجاز يجب أن تكون بين 0 و 100."],
      default: 0,
    },

    images: {
      type: [String],
      default: [],
    },

    activityPdf: [
      {
        filename: String,
        path: String,
      },
    ],

    projectLocationLink: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.pre("save", function (next) {
  if (
    this.isModified("contractualValue") ||
    this.isModified("disbursedAmount")
  ) {
    this.undisbursedAmount = this.contractualValue - this.disbursedAmount;
    if (this.undisbursedAmount < 0) {
      this.undisbursedAmount = 0;
    }
  }
  next();
});

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
