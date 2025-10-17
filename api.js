// API module - handles fetching data from Tesouro Direto
const API = {
  URL: "https://www.tesourodireto.com.br/o/rentabilidade/investir",

  async fetchBonds() {
    try {
      const response = await fetch(this.URL);
      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      return this.parseBonds(data);
    } catch (error) {
      console.error("Failed to fetch bonds:", error);
      return null;
    }
  },

  parseBonds(data) {
    return data.map((bond) => ({
      name: bond.treasuryBondName,
      code: bond.treasuryBondCode,
      type: this.getBondType(bond.financialIndexerCode),
      rate: this.extractRate(bond.investmentProfitabilityIndexerName),
      maturityDate: bond.maturityDate.split("T")[0],
      minValue: bond.investmentBondMinimumValue,
      description: bond.indication.split("|")[0],
      interestType: bond.typeReceiptInterest, // U = único, S = semestral, M = mensal
    }));
  },

  getBondType(indexerCode) {
    // 17 = SELIC, 19 = Prefixado, 22 = IPCA
    if (indexerCode === 17) return "selic";
    if (indexerCode === 19) return "prefixado";
    if (indexerCode === 22) return "ipca";
    return "unknown";
  },

  extractRate(rateString) {
    // Extract number from strings like "13,33%" or "SELIC + 0,049%" or "IPCA + 8,06%"
    const match = rateString.match(/[\d,]+%$/);
    if (!match) return 0;
    return parseFloat(match[0].replace(",", ".").replace("%", ""));
  },
};
