const Budget = require("../Models/budget_model");
const {
  httpSuccessStatus,
  httpFaliureStatus,
  httpErrorStatus,
} = require("../utils/http_status");

const upsertBudget = async (req, res) => {
  try {
    const { fiscalYear, amount } = req.body;

    if (!fiscalYear || amount === undefined || amount === null) {
      return res
        .status(400)
        .json(httpFaliureStatus("السنة المالية وقيمة المخصص مطلوبين"));
    }

    if (isNaN(amount) || Number(amount) < 0) {
      return res
        .status(400)
        .json(
          httpFaliureStatus("قيمة المخصص لازم تكون رقم أكبر من أو يساوي صفر"),
        );
    }

    const budget = await Budget.findOneAndUpdate(
      { fiscalYear: fiscalYear.trim() },
      { amount: Number(amount) },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    const isNew = budget.createdAt.getTime() === budget.updatedAt.getTime();

    res.status(isNew ? 201 : 200).json(httpSuccessStatus(budget));
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json(httpFaliureStatus(messages.join(", ")));
    }

    res.status(500).json(httpErrorStatus(error.message));
  }
};

const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ fiscalYear: -1 });

    res.status(200).json(httpSuccessStatus(budgets));
  } catch (error) {
    res.status(500).json(httpErrorStatus(error.message));
  }
};

const getBudgetByYear = async (req, res) => {
  try {
    const { fiscalYear } = req.params;

    const budget = await Budget.findOne({
      fiscalYear: fiscalYear.trim(),
    });

    if (!budget) {
      return res
        .status(404)
        .json(httpFaliureStatus(`مفيش مخصص مالي للسنة ${fiscalYear}`));
    }

    res.status(200).json(httpSuccessStatus(budget));
  } catch (error) {
    res.status(500).json(httpErrorStatus(error.message));
  }
};

module.exports = {
  upsertBudget,
  getAllBudgets,
  getBudgetByYear,
};
