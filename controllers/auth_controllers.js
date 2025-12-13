const employeeModel = require("../Models/employee_model");
const bcrypt = require("bcrypt");
const generateJWT = require("../utils/generateJWT");
const httpStatus = require("../utils/http_status");

const register = async (req, res) => {
  const { name, role, password, email, region } = req.body;

  const currentUserRegion = req.currentEmployee
    ? req.currentEmployee.region
    : null;

  if (currentUserRegion && currentUserRegion !== "الكل") {
    if (region.trim() !== currentUserRegion.trim()) {
      return res
        .status(403)
        .json(
          httpStatus.httpFaliureStatus(
            `غير مسموح لك بتسجيل موظفين إلا في محافظتك: ${currentUserRegion}`
          )
        );
    }

    req.body.region = currentUserRegion.trim();
  }

  const oldEmployee = await employeeModel.findOne({ name });
  if (oldEmployee) {
    return res
      .status(400)
      .json(httpStatus.httpFaliureStatus("اسم المستخدم موجود من قبل"));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newEmployee = new employeeModel({
    name,
    email,
    role,
    password: hashedPassword,
    region: req.body.region,
  });
  const token = await generateJWT({
    name: newEmployee.name,
    role: newEmployee.role,
    email: newEmployee.email,
    region: newEmployee.region,
  });
  newEmployee.token = token;
  await newEmployee.save();
  res.status(201).json(httpStatus.httpSuccessStatus(newEmployee));
};

const MAX_LOGIN_ATTEMPTS = 3;

const login = async (req, res) => {
  const { name, password } = req.body;

  const employee = await employeeModel.findOne({ name });

  if (!employee) {
    return res
      .status(404)
      .json(
        httpStatus.httpFaliureStatus("اسم المستخدم أو كلمة المرور غير صحيحة")
      );
  }

  if (employee.isLocked) {
    return res
      .status(403)
      .json(httpStatus.httpFaliureStatus("تم قفل الحساب. تواصل مع الإدارة"));
  }

  const isPasswordValid = await bcrypt.compare(password, employee.password);

  if (!isPasswordValid) {
    employee.loginAttempts += 1;

    if (employee.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      employee.isLocked = true;
      await employee.save();
      return res
        .status(403)
        .json(
          httpStatus.httpFaliureStatus("تم قفل الحساب بسبب 3 محاولات فاشلة")
        );
    }

    await employee.save();
    return res
      .status(401)
      .json(
        httpStatus.httpFaliureStatus(
          `كلمة المرور غير صحيحة. متبقي ${
            MAX_LOGIN_ATTEMPTS - employee.loginAttempts
          } محاولات`
        )
      );
  }

  employee.loginAttempts = 0;

  const token = await generateJWT({
    name: employee.name,
    role: employee.role,
    region: employee.region,
  });

  employee.token = token;
  await employee.save();

  res.status(200).json(httpStatus.httpSuccessStatus(employee));
};

const changePassword = async (req, res) => {
  try {
    const { OldPassword, NewPassword, ConfirmPassword } = req.body;
    const name = req.currentEmployee.name;

    const employee = await employeeModel.findOne({ name });
    if (!employee) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Employee not found"));
    }

    const isMatch = await bcrypt.compare(OldPassword, employee.password);
    if (!isMatch) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("Old password is incorrect"));
    }

    if (OldPassword === NewPassword) {
      return res
        .status(400)
        .json(
          httpStatus.httpFaliureStatus(
            "New password must be different from old password"
          )
        );
    }

    if (NewPassword !== ConfirmPassword) {
      return res
        .status(400)
        .json(
          httpStatus.httpFaliureStatus(
            "New password and confirmation do not match"
          )
        );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NewPassword, salt);

    employee.password = hashedPassword;
    await employee.save();

    return res
      .status(200)
      .json(httpStatus.httpSuccessStatus("Password changed successfully"));
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json(
        httpStatus.httpFaliureStatus("Server error while changing password")
      );
  }
};

const unlockAccount = async (req, res) => {
  try {
    const { name } = req.body;

    const employee = await employeeModel.findOne({ name });

    if (!employee) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("الموظف غير موجود"));
    }

    if (!employee.isLocked) {
      return res
        .status(400)
        .json(httpStatus.httpFaliureStatus("الحساب مفتوح بالفعل وليس مقفولاً"));
    }

    employee.isLocked = false;
    employee.loginAttempts = 0;
    employee.lockedAt = null;
    await employee.save();

    return res
      .status(200)
      .json(httpStatus.httpSuccessStatus("تم فتح الحساب بنجاح"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(httpStatus.httpFaliureStatus("حدث خطأ في السيرفر"));
  }
};

const getProfile = async (req, res) => {
  try {
    const name = req.currentEmployee.name;
    const employee = await employeeModel.findOne({ name });
    if (!employee) {
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Employee not found"));
    }
    return res.status(200).json(httpStatus.httpSuccessStatus(employee));
  } catch (err) {
    //console.error(err);
    return res
      .status(500)
      .json(
        httpStatus.httpFaliureStatus("Server error while fetching profile")
      );
  }
};

module.exports = {
  register,
  login,
  changePassword,
  getProfile,
  unlockAccount,
};
