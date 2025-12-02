const employeeModel = require("../Models/employee_model");
const httpStatus = require("../utils/http_status");

const GetAllEmployees = async (req, res) => {
  try {
    const regionFilter = req.regionFilter || {};

    const employees = await employeeModel.find(regionFilter, {
      __v: 0,
      password: 0,
    });

    res.status(200).json(httpStatus.httpSuccessStatus(employees));
  } catch (error) {
    res.status(500).json(httpStatus.httpErrorStatus(error.message));
  }
};

const GetEmployeeById = async (req, res) => {
  try {
    const { name } = req.params;
    const employee = await employeeModel.findOne({ name });

    if (!employee) return res.status(404).json(httpStatus.httpFaliureStatus());

    res.status(200).json(httpStatus.httpSuccessStatus(employee));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const DeleteEmployee = async (req, res) => {
  try {
    const { name } = req.params;

    const filter = {
      name,
      ...(req.regionFilter || {}),
    };

    const employee = await employeeModel.findOneAndDelete(filter);

    if (!employee)
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("ليس لديك الصلاحيات لتعديل هذا الموظف")
        );

    res.status(200).json(httpStatus.httpSuccessStatus("نم حذف الموظف بنجاح"));
  } catch (error) {
    res.status(400).json(httpStatus.httpErrorStatus(error.message));
  }
};

const UpdateEmployee = async (req, res) => {
  try {
    const { name } = req.params;

    const filter = {
      name,
      ...(req.regionFilter || {}),
    };

    const updatedEmployee = await employeeModel.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true, context: "query" }
    );

    if (!updatedEmployee)
      return res
        .status(404)
        .json(
          httpStatus.httpFaliureStatus("ليس لديك الصلاحيات لتعديل هذا الموظف")
        );

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
