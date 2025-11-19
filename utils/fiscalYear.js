const getFiscalYear = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

module.exports = {
  getFiscalYear,
};
