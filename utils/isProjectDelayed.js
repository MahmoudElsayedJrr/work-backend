const isProjectDelayed = (progress, startDate, completionDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(completionDate);
    
    if (now < start || progress >= 100) {
      return false;
    }
    
    if (now > end && progress < 100) {
      return true;
    }
    
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const remainingProgress = 100 - progress;
    const remainingTimePercentage = (remainingDays / totalDays) * 100;
    
    console.log(`
      📊 تحليل المشروع:
      - النسبة المنجزة: ${progress}%
      - النسبة المتبقية: ${remainingProgress}%
      - الأيام الكلية: ${totalDays}
      - الأيام المتبقية: ${remainingDays}
      - نسبة الوقت المتبقي: ${remainingTimePercentage.toFixed(2)}%
      - حالة التعثر: ${remainingProgress > remainingTimePercentage ? '⚠️ متعثر' : '✅ مستقر'}
    `);
    
   
    return remainingProgress > remainingTimePercentage;
  };

  module.exports = isProjectDelayed;