// Main application logic
const App = {
  bonds: [],
  currentRate: 10.75,

  async init() {
    UI.init();

    UI.updateSubtitle("🔄 Carregando taxas atualizadas do Tesouro Direto...");

    const bonds = await API.fetchBonds();

    if (bonds && bonds.length > 0) {
      this.bonds = bonds;
      UI.updateSubtitle(
        `✅ ${
          bonds.length
        } títulos atualizados | Última atualização: ${Formatter.formatDateTime()}`
      );
      console.log(`✅ ${bonds.length} títulos carregados com sucesso!`);
    } else {
      this.loadDefaultBonds();
      UI.updateSubtitle(
        "⚠️ Usando dados estimados (10/2025) | Taxas podem estar desatualizadas"
      );
      console.log("ℹ️ Usando dados padrão. API não disponível.");
    }

    this.setupEventListeners();
  },

  loadDefaultBonds() {
    this.bonds = [
      {
        name: "Tesouro Prefixado 2028",
        type: "prefixado",
        rate: 13.33,
        maturityDate: "2028-01-01",
        description: "Rentabilidade definida",
      },
      {
        name: "Tesouro Prefixado 2032",
        type: "prefixado",
        rate: 13.83,
        maturityDate: "2032-01-01",
        description: "Rentabilidade definida",
      },
      {
        name: "Tesouro Selic 2028",
        type: "selic",
        rate: 0.049,
        maturityDate: "2028-03-01",
        description: "Rentabilidade atrelada à Selic",
      },
      {
        name: "Tesouro Selic 2031",
        type: "selic",
        rate: 0.1025,
        maturityDate: "2031-03-01",
        description: "Rentabilidade atrelada à Selic",
      },
      {
        name: "Tesouro IPCA+ 2029",
        type: "ipca",
        rate: 8.06,
        maturityDate: "2029-05-15",
        description: "Protege do poder de compra",
      },
      {
        name: "Tesouro IPCA+ 2040",
        type: "ipca",
        rate: 7.44,
        maturityDate: "2040-08-15",
        description: "Protege do poder de compra",
      },
    ];
  },

  setupEventListeners() {
    UI.elements.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.calculate();
    });

    document.getElementById("marketRate").addEventListener("change", () => {
      if (UI.elements.results.style.display !== "none") {
        this.calculate();
      }
    });
  },

  calculate() {
    const data = UI.getFormData();

    if (!UI.validateForm(data)) return;

    // Calculate maturity value
    const maturityResult = Calculator.calculateMaturityValue(
      data.investedAmount,
      data.contractedRate,
      data.investmentDate,
      data.maturityDate
    );
    UI.displayMaturityResults(maturityResult);

    // Calculate current value
    const currentResult = Calculator.calculateCurrentValue(
      data.investedAmount,
      data.contractedRate,
      data.marketRate,
      data.investmentDate,
      data.maturityDate
    );
    UI.displayCurrentResults(currentResult);

    // Load reinvestment options
    UI.renderBonds(this.bonds, (bond) =>
      this.simulateReinvestment(bond, currentResult.netCurrentValue)
    );

    UI.showResults();
  },

  simulateReinvestment(bond, availableAmount) {
    const currentDate = new Date().toISOString().split("T")[0];
    const rate =
      bond.type === "selic" ? this.currentRate + bond.rate : bond.rate;

    const result = Calculator.simulateReinvestment(
      availableAmount,
      rate,
      currentDate,
      bond.maturityDate
    );

    UI.displayReinvestmentResults(result);
  },
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Calculadora de Tesouro Direto iniciada");
  App.init();
});
