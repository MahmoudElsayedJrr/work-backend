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
          "الإسماعيلية",
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
          "منازل بدوية",
          "إسكان اجتماعي",
          "خدمات",
          "تنمية متكاملة",
          "حضانات",
          "مجازر",
          "مباني حكومية",
          "اخر",
        ],
        message: "فئة المشروع المدخلة غير صالحة.",
      },
    },

    status: {
      //حاله النشاط
      type: String,
      enum: ["قيد التنفيذ", "مكتمل", "متأخر", "مسحوب", "متوقف"],
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
    fiscalYear: {
      type: String,
      default: null,
    },
    extension: [
      {
        extensionNumber: {
          type: Number,
          min: 0,
        },

        extensionDate: {
          // تاريخ مد المده
          type: Date,
          default: null,
        },
      },
    ],

    suspensionDate: {
      // تاريخ  محضر التوقف
      type: Date,
      default: null,
    },

    resumptionDate: {
      // تاريخ  الاستئناف
      type: Date,
      default: null,
    },

    executivePosition: {
      type: String,
      trim: true,
      default: "",
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

    activitypdfs: [
      {
        filename: String,
        path: String,
      },
    ],

    projectLocationLink: {
      type: String,
      default: "",
    },

    contract: [
      {
        contractNumber: {
          type: Number,
          min: 0,
        },

        contractPrice: {
          type: Number,
          min: 0,
        },

        contractDate: {
          type: Date,
          default: null,
        },
      },
    ],

    decision: [
      {
        decisionName: {
          type: String,
          trim: true,
        },
        decisionType: {
          type: String,
          trim: true,
          enum: {
            values: ["تعاقدي", "مستجد", "متجاوز"],
            message: 'نوع البند يجب أن يكون "تعاقدي" أو "مستجد" أو "متجاوز.',
          },
        },

        decisionQuantity: {
          type: Number,
          min: 0,
        },

        decisionUnit: {
          type: String,
          trim: true,
        },

        decisionPrice: {
          type: Number,
          min: 0,
        },
        decisionTotal: {
          type: Number,
          min: 0,
        },
      },
    ],

    roaddetails: {
      petroleumCompany: {
        type: String,
        trim: true,
        default: "N/A",
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
        default: "",
      },
    },

    extract: [
      {
        extractValue: {
          type: Number,
          required: [true, "قيمة المستخلص مطلوبة."],
          min: [0, "قيمة المستخلص يجب أن تكون أكبر من أو تساوي صفر."],
        },
        extractDate: {
          type: Date,
          required: [true, "تاريخ المستخلص مطلوب."],
          default: Date.now,
        },

        extractPDFs: [
          {
            filename: String,
            path: String,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

activitySchema.pre("save", function (next) {
  // Ensure arrays are properly initialized
  if (!Array.isArray(this.contractualDocuments)) {
    this.contractualDocuments = [];
  }
  if (!Array.isArray(this.activitypdfs)) {
    this.activitypdfs = [];
  }
  if (!Array.isArray(this.images)) {
    this.images = [];
  }

  // Ensure roaddetails is properly initialized and handle array values
  if (this.roaddetails) {
    // Handle petroleumCompany
    if (Array.isArray(this.roaddetails.petroleumCompany)) {
      this.roaddetails.petroleumCompany =
        this.roaddetails.petroleumCompany[0] || "N/A";
    }

    // Handle bitumenQuantity
    if (Array.isArray(this.roaddetails.bitumenQuantity)) {
      this.roaddetails.bitumenQuantity =
        parseFloat(this.roaddetails.bitumenQuantity[0]) || 0;
    }

    // Handle mc
    if (Array.isArray(this.roaddetails.mc)) {
      this.roaddetails.mc = parseFloat(this.roaddetails.mc[0]) || 0;
    }

    // Handle rc
    if (Array.isArray(this.roaddetails.rc)) {
      this.roaddetails.rc = parseFloat(this.roaddetails.rc[0]) || 0;
    }

    // Handle remainingQuantitiesTons
    if (Array.isArray(this.roaddetails.remainingQuantitiesTons)) {
      this.roaddetails.remainingQuantitiesTons =
        parseFloat(this.roaddetails.remainingQuantitiesTons[0]) || 0;
    }

    // Handle notes
    if (Array.isArray(this.roaddetails.notes)) {
      this.roaddetails.notes = this.roaddetails.notes[0] || "";
    }
  }

  // Calculate undisbursed amount
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
