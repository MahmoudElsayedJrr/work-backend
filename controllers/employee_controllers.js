const employeeModel = require("../Models/employee_model");
const httpStatus = require("../utils/http_status");

const GetAllEmployees = async (req, res) => {
  try {
    const employees = await employeeModel.find({}, { __v: 0, password: 0 });
    res.status(200).json(httpStatus.httpSuccessStatus(employees));
  } catch (error) {
    res.status(500).json(اhttpStatus.httpErrorStatus(error.message));
  }
};

const GetEmployeeById = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const employee = await employeeModel.findOne({ nationalId });

    if (!employee) return res.status(404).json(httpStatus.httpFaliureStatus());

    // res.json(employee);
    res.status(200).json(httpStatus.httpSuccessStatus(employee));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const DeleteEmployee = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const employee = await employeeModel.findOneAndDelete({ nationalId });

    if (!employee)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Employee not found"));

    res
      .status(200)
      .json(httpStatus.httpSuccessStatus("Employee deleted successfully"));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const UpdateEmployee = async (req, res) => {
  try {
    const { nationalId } = req.params;
    const updatedEmployee = await employeeModel.findOneAndUpdate(
      { nationalId },
      { $set: req.body },
      { new: true }
    );

    if (!updatedEmployee)
      return res
        .status(404)
        .json(httpStatus.httpFaliureStatus("Employee not found"));

    res.status(200).json(httpStatus.httpSuccessStatus(updatedEmployee));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

module.exports = {
  GetAllEmployees,
  GetEmployeeById,
  DeleteEmployee,
  UpdateEmployee,
};
