const mongoose = require("mongoose");
const validator = require("validator");
const employeeSchema = new mongoose.Schema(
  {
    /*  nationalId: {
      type: String,
      required: [true, "Id is required"],
      unique: true,
    }, */
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (value) {
          return !/\s/.test(value); // يرجع false لو فيه أي مسافة
        },
        message: "Name must not contain spaces",
      },
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please enter a valid email address."],
    },
    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "employee",
        "financial",
        "projectManager",
        "executive",
        "contractual",
      ],
      default: "employee",
    },

    region: {
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
          "الكل",
          "",
        ],
        message: "القيمة المدخلة للمحافظة غير صالحة.",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },

    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
