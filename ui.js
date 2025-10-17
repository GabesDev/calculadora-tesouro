// UI module - handles DOM updates and user interactions
const UI = {
  elements: {},

  init() {
    this.elements = {
      form: document.getElementById("investmentForm"),
      subtitle: document.getElementById("headerSubtitle"),
      results: document.getElementById("results"),

      // Maturity elements
      grossMaturityValue: document.getElementById("grossMaturityValue"),
      maturityTax: document.getElementById("maturityTax"),
      netMaturityValue: document.getElementById("netMaturityValue"),
      maturityReturn: document.getElementById("maturityReturn"),

      // Current value elements
      grossCurrentValue: document.getElementById("grossCurrentValue"),
      currentTax: document.getElementById("currentTax"),
      netCurrentValue: document.getElementById("netCurrentValue"),
      currentReturn: document.getElementById("currentReturn"),

      // Reinvestment elements
      availableBonds: document.getElementById("availableBonds"),
      reinvestAmount: document.getElementById("reinvestAmount"),
      reinvestFutureValue: document.getElementById("reinvestFutureValue"),
      reinvestReturn: document.getElementById("reinvestReturn"),
      reinvestmentResults: document.getElementById("reinvestmentResults"),
    };
  },

  updateSubtitle(message) {
    this.elements.subtitle.innerHTML = message;
  },

  showResults() {
    this.elements.results.style.display = "block";
    this.elements.results.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  },

  displayMaturityResults(result) {
    this.elements.grossMaturityValue.textContent = Formatter.formatCurrency(
      result.grossValue
    );
    this.elements.maturityTax.textContent = this.formatTaxText(result);
    this.elements.netMaturityValue.textContent = Formatter.formatCurrency(
      result.netValue
    );
    this.elements.maturityReturn.textContent = Formatter.formatCurrency(
      result.returns
    );
  },

  displayCurrentResults(result) {
    this.elements.grossCurrentValue.textContent = Formatter.formatCurrency(
      result.grossCurrentValue
    );
    this.elements.currentTax.textContent = this.formatTaxText(result);
    this.elements.netCurrentValue.textContent = Formatter.formatCurrency(
      result.netCurrentValue
    );
    this.elements.currentReturn.textContent = Formatter.formatCurrency(
      result.netReturns
    );
  },

  displayReinvestmentResults(result) {
    this.elements.reinvestAmount.textContent = Formatter.formatCurrency(
      result.investedAmount
    );
    this.elements.reinvestFutureValue.textContent = Formatter.formatCurrency(
      result.netFutureValue
    );
    this.elements.reinvestReturn.textContent = `${Formatter.formatCurrency(
      result.returns
    )} (em ${result.years.toFixed(1)} anos)`;
    this.elements.reinvestmentResults.style.display = "block";
  },

  formatTaxText(result) {
    let text = "";
    if (result.iof > 0) {
      text = `IOF: ${Formatter.formatCurrency(
        result.iof
      )} (${Formatter.formatPercentage(result.iofRate * 100)}) + `;
    }
    text += `IR: ${Formatter.formatCurrency(
      result.incomeTax
    )} (${Formatter.formatPercentage(result.taxRate * 100)})`;
    return text;
  },

  renderBonds(bonds, onSelect) {
    const container = this.elements.availableBonds;
    container.innerHTML = "";

    if (!bonds || bonds.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666;">Nenhum título disponível.</p>';
      return;
    }

    bonds.forEach((bond, index) => {
      const bondDiv = document.createElement("div");
      bondDiv.className = "bond-option";
      bondDiv.dataset.index = index;

      const rateDisplay = this.formatBondRate(bond);

      bondDiv.innerHTML = `
        <div class="bond-header">
          <span class="bond-name">${bond.name}</span>
          <span class="bond-rate">${rateDisplay}</span>
        </div>
        <div class="bond-details">
          <span>📅 ${Formatter.formatDate(bond.maturityDate)}</span>
          <span>📊 ${bond.type.toUpperCase()}</span>
        </div>
        <p>${bond.description}</p>
      `;

      bondDiv.addEventListener("click", () => {
        document
          .querySelectorAll(".bond-option")
          .forEach((el) => el.classList.remove("selected"));
        bondDiv.classList.add("selected");
        onSelect(bond);
      });

      container.appendChild(bondDiv);
    });
  },

  formatBondRate(bond) {
    if (bond.type === "ipca") return `IPCA + ${bond.rate.toFixed(2)}%`;
    if (bond.type === "selic") return `SELIC + ${bond.rate.toFixed(3)}%`;
    return `${bond.rate.toFixed(2)}% a.a.`;
  },

  getFormData() {
    return {
      investedAmount: parseFloat(
        document.getElementById("investedAmount").value
      ),
      contractedRate: parseFloat(
        document.getElementById("contractedRate").value
      ),
      investmentDate: document.getElementById("investmentDate").value,
      maturityDate: document.getElementById("maturityDate").value,
      marketRate: parseFloat(document.getElementById("marketRate").value),
    };
  },

  validateForm(data) {
    if (data.investedAmount <= 0) {
      alert("O valor investido deve ser maior que zero.");
      return false;
    }

    if (data.contractedRate <= 0 || data.contractedRate > 100) {
      alert("A taxa contratada deve estar entre 0 e 100%.");
      return false;
    }

    if (data.marketRate <= 0 || data.marketRate > 100) {
      alert("A taxa de mercado deve estar entre 0 e 100%.");
      return false;
    }

    const invDate = new Date(data.investmentDate);
    const matDate = new Date(data.maturityDate);
    const today = new Date();

    if (invDate >= matDate) {
      alert("A data de vencimento deve ser posterior à data de investimento.");
      return false;
    }

    if (matDate <= today) {
      alert("A data de vencimento deve ser futura.");
      return false;
    }

    return true;
  },
};
