// Calculator module - pure calculation functions
const Calculator = {
  // Date calculations
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  },

  calculateYears(startDate, endDate) {
    return this.calculateDays(startDate, endDate) / 365.25;
  },

  // Tax calculations
  calculateTaxRate(days) {
    if (days <= 180) return 0.225;
    if (days <= 360) return 0.2;
    if (days <= 720) return 0.175;
    return 0.15;
  },

  calculateIOFRate(days) {
    if (days >= 30) return 0;

    const iofTable = [
      96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40,
      36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0,
    ];

    if (days < 1) return 0.96;
    if (days <= 29) return iofTable[days - 1] / 100;
    return 0;
  },

  calculateTax(investedAmount, grossValue, days) {
    const profit = grossValue - investedAmount;
    if (profit <= 0) return 0;
    return profit * this.calculateTaxRate(days);
  },

  calculateIOF(investedAmount, grossValue, days) {
    const profit = grossValue - investedAmount;
    if (profit <= 0) return 0;
    return profit * this.calculateIOFRate(days);
  },

  // Value calculations
  calculateFutureValue(principal, rate, years) {
    return principal * Math.pow(1 + rate / 100, years);
  },

  calculatePresentValue(futureValue, marketRate, remainingYears) {
    return futureValue / Math.pow(1 + marketRate / 100, remainingYears);
  },

  // Main calculation methods
  calculateMaturityValue(investedAmount, rate, startDate, maturityDate) {
    const years = this.calculateYears(startDate, maturityDate);
    const days = this.calculateDays(startDate, maturityDate);
    const grossValue = this.calculateFutureValue(investedAmount, rate, years);
    const iof = this.calculateIOF(investedAmount, grossValue, days);
    const incomeTax = this.calculateTax(investedAmount, grossValue, days);
    const netValue = grossValue - iof - incomeTax;

    return {
      grossValue,
      iof,
      incomeTax,
      netValue,
      returns: netValue - investedAmount,
      years,
      days,
      taxRate: this.calculateTaxRate(days),
      iofRate: this.calculateIOFRate(days),
    };
  },

  calculateCurrentValue(
    investedAmount,
    contractedRate,
    marketRate,
    startDate,
    maturityDate,
    currentDate = new Date()
  ) {
    const totalYears = this.calculateYears(startDate, maturityDate);
    const contractedFutureValue = this.calculateFutureValue(
      investedAmount,
      contractedRate,
      totalYears
    );
    const remainingYears = this.calculateYears(currentDate, maturityDate);
    const elapsedDays = this.calculateDays(startDate, currentDate);
    const grossCurrentValue = this.calculatePresentValue(
      contractedFutureValue,
      marketRate,
      remainingYears
    );
    const iof = this.calculateIOF(
      investedAmount,
      grossCurrentValue,
      elapsedDays
    );
    const incomeTax = this.calculateTax(
      investedAmount,
      grossCurrentValue,
      elapsedDays
    );
    const netCurrentValue = grossCurrentValue - iof - incomeTax;

    return {
      grossCurrentValue,
      iof,
      incomeTax,
      netCurrentValue,
      netReturns: netCurrentValue - investedAmount,
      elapsedDays,
      remainingYears,
      taxRate: this.calculateTaxRate(elapsedDays),
      iofRate: this.calculateIOFRate(elapsedDays),
    };
  },

  simulateReinvestment(availableAmount, newRate, startDate, maturityDate) {
    const years = this.calculateYears(startDate, maturityDate);
    const days = this.calculateDays(startDate, maturityDate);
    const grossFutureValue = this.calculateFutureValue(
      availableAmount,
      newRate,
      years
    );
    const iof = this.calculateIOF(availableAmount, grossFutureValue, days);
    const incomeTax = this.calculateTax(
      availableAmount,
      grossFutureValue,
      days
    );
    const netFutureValue = grossFutureValue - iof - incomeTax;

    return {
      investedAmount: availableAmount,
      grossFutureValue,
      iof,
      incomeTax,
      netFutureValue,
      returns: netFutureValue - availableAmount,
      years,
      days,
      taxRate: this.calculateTaxRate(days),
      iofRate: this.calculateIOFRate(days),
    };
  },
};
