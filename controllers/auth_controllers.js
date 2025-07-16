const employeeModel = require("../Models/employee_model");
const bcrypt = require("bcrypt");
const generateJWT = require("../utils/generateJWT");
const httpStatus = require("../utils/http_status");

const register = async (req, res) => {
  const { nationalId, name, role, password, email } = req.body;
  const oldEmployee = await employeeModel.findOne({ nationalId });
  if (oldEmployee) {
    return res
      .status(400)
      .json(
        httpStatus.httpFaliureStatus(
          "Employee with this national ID already exists"
        )
      );
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newEmployee = new employeeModel({
    nationalId,
    name,
    email,
    role,
    password: hashedPassword,
  });
  const token = await generateJWT({
    nationalId: newEmployee.nationalId,
    name: newEmployee.name,
    role: newEmployee.role,
    email: newEmployee.email,
  });
  newEmployee.token = token;
  await newEmployee.save();
  res.status(201).json(httpStatus.httpSuccessStatus(newEmployee));
};

const login = async (req, res) => {
  const { nationalId, password } = req.body;
  const employee = await employeeModel.findOne({ nationalId: nationalId });
  if (!employee) {
    return res
      .status(404)
      .json(
        httpStatus.httpFaliureStatus("الرقم القومي أو كلمة المرور غير صحيحة")
      );
  }
  const isPasswordValid = await bcrypt.compare(password, employee.password);
  if (!isPasswordValid) {
    return res
      .status(401)
      .json(httpStatus.httpFaliureStatus("كلمة المرور غير صحيحة"));
  }
  const token = await generateJWT({
    nationalId: employee.nationalId,
    name: employee.name,
    role: employee.role,
  });
  employee.token = token;
  await employee.save();
  res.status(200).json(httpStatus.httpSuccessStatus(employee));
};

const changePassword = async (req, res) => {
  try {
    const { OldPassword, NewPassword, ConfirmPassword } = req.body;
    const nationalId = req.currentEmployee.nationalId;

    const employee = await employeeModel.findOne({ nationalId });
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

const getProfile = async (req, res) => {
  try {
    const nationalId = req.currentEmployee.nationalId;
    const employee = await employeeModel.findOne({ nationalId });
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
};
