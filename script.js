class TreasuryCalculator {
  constructor() {
    this.availableBonds = [];
    this.bondsLoading = true;
    this.currentSelicRate = 10.75; // Fallback - will be updated by API
  }

  // Fetch Treasury bonds in real-time
  async fetchTreasuryBonds() {
    // Direct CSV download URL (works without CORS issues)
    const csvUrl =
      "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv";

    // Try Netlify function first (recommended - no CORS issues)
    try {
      console.log("🔄 Tentando buscar via Netlify function...");
      const netlifyResponse = await fetch("/.netlify/functions/treasury-api");

      console.log("📊 Netlify function status:", netlifyResponse.status);

      if (netlifyResponse.ok) {
        const data = await netlifyResponse.json();
        console.log("📦 Dados recebidos da Netlify function:", data);

        if (data.success && data.result && data.result.records) {
          this.processAPIBonds(data.result.records);
          console.log("✅ Títulos atualizados via Netlify function");
          return true;
        } else {
          console.warn(
            "⚠️ Netlify function retornou dados em formato inesperado"
          );
        }
      } else {
        const errorText = await netlifyResponse.text();
        console.error(
          "❌ Netlify function falhou:",
          netlifyResponse.status,
          errorText
        );
      }
    } catch (netlifyError) {
      console.error("❌ Erro ao chamar Netlify function:", netlifyError);
      console.log(
        "ℹ️ Netlify function não disponível, tentando download direto do CSV..."
      );
    }

    // Try direct CSV download (may fail due to CORS in some browsers)
    try {
      console.log("🔄 Tentando download direto do CSV...");
      const response = await fetch(csvUrl, {
        mode: "cors",
        headers: {
          Accept: "text/csv,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      console.log(
        `📦 CSV recebido: ${(csvText.length / 1024 / 1024).toFixed(2)} MB`
      );

      const records = this.parseCSV(csvText);

      if (records.length > 0) {
        this.processAPIBonds(records);
        console.log("✅ Títulos atualizados via download direto do CSV");
        return true;
      } else {
        throw new Error("Nenhum registro encontrado no CSV");
      }
    } catch (directError) {
      console.warn(
        "⚠️ Download direto falhou (provável CORS):",
        directError.message
      );
      console.info(
        "💡 Usando dados padrão. Para dados em tempo real, acesse via: https://tesouro.gabes.dev/"
      );
      this.loadDefaultBonds();
      return false;
    }
  }

  // Parse CSV data from Treasury Direct
  parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const records = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(";");
      if (fields.length < 8) continue;

      // Parse date in DD/MM/YYYY format
      const dateParts = fields[1].split("/");
      let vencimento = null;
      if (dateParts.length === 3) {
        vencimento = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert to YYYY-MM-DD
      }

      const record = {
        TpTitulo: fields[0],
        VctdTitulo: vencimento,
        DtBase: fields[2],
        TxCompra: parseFloat(fields[3]?.replace(",", ".")) || null,
        TxVenda: parseFloat(fields[4]?.replace(",", ".")) || null,
        PUCompra: parseFloat(fields[5]?.replace(",", ".")) || null,
        PUVenda: parseFloat(fields[6]?.replace(",", ".")) || null,
        PUBase: parseFloat(fields[7]?.replace(",", ".")) || null,
      };

      records.push(record);
    }

    return records;
  }

  // Process data from Treasury API
  processAPIBonds(records) {
    const today = new Date();
    const uniqueBonds = new Map();

    records.forEach((record) => {
      if (!record.VctdTitulo || !record.TxVenda) return;

      const maturityDate = new Date(record.VctdTitulo);
      if (maturityDate <= today) return; // Ignore expired bonds

      const bondName = record.TipoTitulo || "";
      const rate = parseFloat(record.TxVenda);

      if (isNaN(rate)) return;

      let type = "prefixado";
      let baseRate = null;
      let description = "Rentabilidade definida no momento da compra";

      if (bondName.includes("IPCA")) {
        type = "ipca";
        baseRate = "IPCA";
        description = "IPCA + taxa prefixada";
      } else if (bondName.includes("Selic")) {
        type = "selic";
        baseRate = "Selic";
        description = "Rentabilidade diária vinculada à taxa Selic";
      }

      const key = `${bondName}-${record.VctdTitulo}`;

      if (!uniqueBonds.has(key) || uniqueBonds.get(key).rate > rate) {
        uniqueBonds.set(key, {
          name: bondName,
          type: type,
          rate: rate,
          baseRate: baseRate,
          maturityDate: record.VctdTitulo,
          description: description,
          unitPrice: parseFloat(record.PrcVenda) || null,
        });
      }
    });

    this.availableBonds = Array.from(uniqueBonds.values()).sort(
      (a, b) => new Date(a.maturityDate) - new Date(b.maturityDate)
    );

    this.bondsLoading = false;
  }

  // Load default bonds in case of API failure
  loadDefaultBonds() {
    this.availableBonds = [
      {
        name: "Tesouro Prefixado 2027",
        type: "prefixado",
        rate: 12.35,
        maturityDate: "2027-01-01",
        description: "Rentabilidade definida (dados estimados)",
      },
      {
        name: "Tesouro Prefixado 2029",
        type: "prefixado",
        rate: 12.5,
        maturityDate: "2029-01-01",
        description: "Rentabilidade definida (dados estimados)",
      },
      {
        name: "Tesouro Prefixado 2031",
        type: "prefixado",
        rate: 12.65,
        maturityDate: "2031-01-01",
        description: "Rentabilidade definida (dados estimados)",
      },
      {
        name: "Tesouro IPCA+ 2029",
        type: "ipca",
        rate: 6.25,
        baseRate: "IPCA",
        maturityDate: "2029-05-15",
        description: "IPCA + taxa prefixada (dados estimados)",
      },
      {
        name: "Tesouro IPCA+ 2035",
        type: "ipca",
        rate: 6.35,
        baseRate: "IPCA",
        maturityDate: "2035-05-15",
        description: "IPCA + taxa prefixada (dados estimados)",
      },
      {
        name: "Tesouro IPCA+ 2040",
        type: "ipca",
        rate: 6.4,
        baseRate: "IPCA",
        maturityDate: "2040-08-15",
        description: "IPCA + taxa prefixada (dados estimados)",
      },
      {
        name: "Tesouro IPCA+ 2045",
        type: "ipca",
        rate: 6.45,
        baseRate: "IPCA",
        maturityDate: "2045-05-15",
        description: "IPCA + taxa prefixada (dados estimados)",
      },
      {
        name: "Tesouro Selic 2027",
        type: "selic",
        rate: 0,
        baseRate: "Selic",
        maturityDate: "2027-03-01",
        description: "100% da taxa Selic (dados estimados)",
      },
      {
        name: "Tesouro Selic 2029",
        type: "selic",
        rate: 0,
        baseRate: "Selic",
        maturityDate: "2029-03-01",
        description: "100% da taxa Selic (dados estimados)",
      },
      {
        name: "Tesouro Renda+ 2030",
        type: "ipca",
        rate: 6.15,
        baseRate: "IPCA",
        maturityDate: "2030-12-15",
        description: "IPCA + taxa para aposentadoria (dados estimados)",
      },
      {
        name: "Tesouro Renda+ 2035",
        type: "ipca",
        rate: 6.2,
        baseRate: "IPCA",
        maturityDate: "2035-12-15",
        description: "IPCA + taxa para aposentadoria (dados estimados)",
      },
      {
        name: "Tesouro Renda+ 2040",
        type: "ipca",
        rate: 6.25,
        baseRate: "IPCA",
        maturityDate: "2040-12-15",
        description: "IPCA + taxa para aposentadoria (dados estimados)",
      },
      {
        name: "Tesouro RendA+ 2045",
        type: "ipca",
        rate: 6.3,
        baseRate: "IPCA",
        maturityDate: "2045-12-15",
        description: "IPCA + taxa para aposentadoria (dados estimados)",
      },
    ];
    this.bondsLoading = false;
  }

  // Calculate number of days between two dates
  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const difference = end - start;
    return Math.floor(difference / (1000 * 60 * 60 * 24));
  }

  // Calculate years between two dates (with decimals)
  calculateYears(startDate, endDate) {
    const days = this.calculateDays(startDate, endDate);
    return days / 365.25; // Considers leap years
  }

  // Calculate income tax rate based on period
  calculateTaxRate(days) {
    if (days <= 180) return 0.225; // 22.5%
    if (days <= 360) return 0.2; // 20.0%
    if (days <= 720) return 0.175; // 17.5%
    return 0.15; // 15.0%
  }

  // Calculate IOF (Financial Operations Tax) for early redemptions
  calculateIOFRate(days) {
    if (days >= 30) return 0; // No IOF after 30 days

    // IOF regressive table (days 1-29)
    // 96% on day 1, decreasing 3% per day until 0% on day 30
    const iofTable = [
      96,
      93,
      90,
      86,
      83,
      80,
      76,
      73,
      70,
      66, // Days 1-10
      63,
      60,
      56,
      53,
      50,
      46,
      43,
      40,
      36,
      33, // Days 11-20
      30,
      26,
      23,
      20,
      16,
      13,
      10,
      6,
      3,
      0, // Days 21-30
    ];

    if (days < 1) return 0.96; // 96% for same day
    if (days <= 29) return iofTable[days - 1] / 100;
    return 0;
  }

  // Calculate future value with compound interest
  calculateFutureValue(principal, rate, years) {
    return principal * Math.pow(1 + rate / 100, years);
  }

  // Calculate present value (mark to market)
  calculatePresentValue(futureValue, marketRate, remainingYears) {
    return futureValue / Math.pow(1 + marketRate / 100, remainingYears);
  }

  // Calculate income tax on returns (only if there's profit)
  calculateTax(investedAmount, grossValue, days) {
    const returns = grossValue - investedAmount;
    if (returns <= 0) return 0; // No tax if no profit

    const taxRate = this.calculateTaxRate(days);
    return returns * taxRate;
  }

  // Calculate IOF on returns (only for early redemptions < 30 days)
  calculateIOF(investedAmount, grossValue, days) {
    const returns = grossValue - investedAmount;
    if (returns <= 0) return 0; // No IOF if no profit

    const iofRate = this.calculateIOFRate(days);
    return returns * iofRate;
  }

  // Calculate value at maturity
  calculateMaturityValue(investedAmount, rate, startDate, maturityDate) {
    const years = this.calculateYears(startDate, maturityDate);
    const days = this.calculateDays(startDate, maturityDate);

    const grossValue = this.calculateFutureValue(investedAmount, rate, years);
    const iof = this.calculateIOF(investedAmount, grossValue, days); // IOF (only < 30 days)
    const incomeTax = this.calculateTax(investedAmount, grossValue, days); // IR
    const netValue = grossValue - iof - incomeTax;
    const returns = netValue - investedAmount;

    return {
      grossValue,
      iof,
      incomeTax,
      netValue,
      returns,
      years,
      days,
      taxRate: this.calculateTaxRate(days),
      iofRate: this.calculateIOFRate(days),
    };
  }

  // Calculate current value (mark to market)
  calculateCurrentValue(
    investedAmount,
    contractedRate,
    marketRate,
    startDate,
    maturityDate,
    currentDate = new Date()
  ) {
    // First, calculate the value to be received at maturity with contracted rate
    const totalYears = this.calculateYears(startDate, maturityDate);
    const contractedFutureValue = this.calculateFutureValue(
      investedAmount,
      contractedRate,
      totalYears
    );

    // Calculate remaining years until maturity
    const remainingYears = this.calculateYears(currentDate, maturityDate);
    const elapsedDays = this.calculateDays(startDate, currentDate);

    // Bring future value to present value using current market rate
    const grossCurrentValue = this.calculatePresentValue(
      contractedFutureValue,
      marketRate,
      remainingYears
    );

    // Calculate returns to date
    const grossReturns = grossCurrentValue - investedAmount;

    // Calculate IOF and income tax on returns
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
    const netReturns = netCurrentValue - investedAmount;

    return {
      grossCurrentValue,
      iof,
      incomeTax,
      netCurrentValue,
      netReturns,
      elapsedDays,
      remainingYears,
      taxRate: this.calculateTaxRate(elapsedDays),
      iofRate: this.calculateIOFRate(elapsedDays),
    };
  }

  // Simulate reinvestment
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
    const returns = netFutureValue - availableAmount;

    return {
      investedAmount: availableAmount,
      grossFutureValue,
      iof,
      incomeTax,
      netFutureValue,
      returns,
      years,
      days,
      taxRate: this.calculateTaxRate(days),
      iofRate: this.calculateIOFRate(days),
    };
  }

  // Format value in Brazilian Real
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  // Format percentage
  formatPercentage(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }
}

// Application initialization
document.addEventListener("DOMContentLoaded", async function () {
  const calculator = new TreasuryCalculator();
  const form = document.getElementById("investmentForm");
  const resultsDiv = document.getElementById("results");
  const subtitle = document.getElementById("headerSubtitle");

  // Update interface during loading
  subtitle.innerHTML = "🔄 Carregando taxas atualizadas do Tesouro Direto...";

  // Load Treasury bonds automatically
  console.log("🔄 Buscando títulos atualizados do Tesouro Direto...");
  const bondsLoaded = await calculator.fetchTreasuryBonds();

  if (bondsLoaded) {
    console.log(
      `✅ ${calculator.availableBonds.length} títulos carregados com sucesso!`
    );

    // Check if we have more than 13 bonds (means API/proxy worked)
    if (calculator.availableBonds.length > 13) {
      subtitle.innerHTML = `✅ ${
        calculator.availableBonds.length
      } títulos atualizados | Última atualização: ${new Date().toLocaleString(
        "pt-BR"
      )}`;
    } else {
      subtitle.innerHTML = `✅ ${
        calculator.availableBonds.length
      } títulos disponíveis | ${new Date().toLocaleString("pt-BR")}`;
    }
  } else {
    console.log(
      "ℹ️ Usando dados padrão. Para taxas em tempo real, hospede o projeto em um servidor."
    );
    subtitle.innerHTML =
      "⚠️ Usando dados estimados (10/2025) | Acompanhe seus investimentos e simule reinvestimentos";
  }

  // Event listener for the form
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calculateInvestment();
  });

  // Main calculation function
  function calculateInvestment() {
    // Get form values
    const investedAmount = parseFloat(
      document.getElementById("investedAmount").value
    );
    const contractedRate = parseFloat(
      document.getElementById("contractedRate").value
    );
    const investmentDate = document.getElementById("investmentDate").value;
    const maturityDate = document.getElementById("maturityDate").value;
    const marketRate = parseFloat(document.getElementById("marketRate").value);

    // Validations
    if (
      !validateInputs(
        investedAmount,
        contractedRate,
        investmentDate,
        maturityDate,
        marketRate
      )
    ) {
      return;
    }

    // 1. Calculate maturity value
    const maturityResult = calculator.calculateMaturityValue(
      investedAmount,
      contractedRate,
      investmentDate,
      maturityDate
    );

    // Display maturity results
    document.getElementById("grossMaturityValue").textContent =
      calculator.formatCurrency(maturityResult.grossValue);

    // Show IOF + IR combined if IOF applies
    let taxText = "";
    if (maturityResult.iof > 0) {
      taxText = `IOF: ${calculator.formatCurrency(
        maturityResult.iof
      )} (${calculator.formatPercentage(maturityResult.iofRate * 100)}) + `;
    }
    taxText += `IR: ${calculator.formatCurrency(
      maturityResult.incomeTax
    )} (${calculator.formatPercentage(maturityResult.taxRate * 100)})`;

    document.getElementById("maturityTax").textContent = taxText;
    document.getElementById("netMaturityValue").textContent =
      calculator.formatCurrency(maturityResult.netValue);
    document.getElementById("maturityReturn").textContent =
      calculator.formatCurrency(maturityResult.returns);

    // 2. Calculate current value (mark to market)
    const currentDate = new Date();
    const currentResult = calculator.calculateCurrentValue(
      investedAmount,
      contractedRate,
      marketRate,
      investmentDate,
      maturityDate,
      currentDate
    );

    // Display current results
    document.getElementById("grossCurrentValue").textContent =
      calculator.formatCurrency(currentResult.grossCurrentValue);

    // Show IOF + IR combined if IOF applies
    let currentTaxText = "";
    if (currentResult.iof > 0) {
      currentTaxText = `IOF: ${calculator.formatCurrency(
        currentResult.iof
      )} (${calculator.formatPercentage(currentResult.iofRate * 100)}) + `;
    }
    currentTaxText += `IR: ${calculator.formatCurrency(
      currentResult.incomeTax
    )} (${calculator.formatPercentage(currentResult.taxRate * 100)})`;

    document.getElementById("currentTax").textContent = currentTaxText;
    document.getElementById("netCurrentValue").textContent =
      calculator.formatCurrency(currentResult.netCurrentValue);
    document.getElementById("currentReturn").textContent =
      calculator.formatCurrency(currentResult.netReturns);

    // 3. Prepare reinvestment options
    loadReinvestmentBonds(currentResult.netCurrentValue);

    // Show results
    resultsDiv.style.display = "block";
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Validate form inputs
  function validateInputs(
    investedAmount,
    contractedRate,
    investmentDate,
    maturityDate,
    marketRate
  ) {
    if (investedAmount <= 0) {
      alert("O valor investido deve ser maior que zero.");
      return false;
    }

    if (contractedRate <= 0 || contractedRate > 100) {
      alert("A taxa contratada deve estar entre 0 e 100%.");
      return false;
    }

    if (marketRate <= 0 || marketRate > 100) {
      alert("A taxa de mercado deve estar entre 0 e 100%.");
      return false;
    }

    const invDate = new Date(investmentDate);
    const matDate = new Date(maturityDate);
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
  }

  // Load available bonds for reinvestment
  function loadReinvestmentBonds(availableAmount) {
    const container = document.getElementById("availableBonds");
    container.innerHTML = "";

    if (calculator.bondsLoading) {
      container.innerHTML =
        '<p style="text-align: center; color: #666;">Carregando títulos...</p>';
      return;
    }

    if (calculator.availableBonds.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666;">Nenhum título disponível.</p>';
      return;
    }

    calculator.availableBonds.forEach((bond, index) => {
      const bondDiv = document.createElement("div");
      bondDiv.className = "bond-option";
      bondDiv.dataset.index = index;

      let rateDisplay;
      if (bond.type === "ipca") {
        rateDisplay = `IPCA + ${bond.rate.toFixed(2)}%`;
      } else if (bond.type === "selic") {
        rateDisplay = `100% Selic`;
      } else {
        rateDisplay = `${bond.rate.toFixed(2)}% a.a.`;
      }

      bondDiv.innerHTML = `
                <div class="bond-header">
                    <span class="bond-name">${bond.name}</span>
                    <span class="bond-rate">${rateDisplay}</span>
                </div>
                <div class="bond-details">
                    <span>📅 ${formatDate(bond.maturityDate)}</span>
                    <span>📊 ${bond.type.toUpperCase()}</span>
                </div>
                <p>${bond.description}</p>
            `;

      bondDiv.addEventListener("click", () => {
        // Remove previous selection
        document.querySelectorAll(".bond-option").forEach((el) => {
          el.classList.remove("selected");
        });

        // Add selection
        bondDiv.classList.add("selected");

        // Calculate reinvestment
        simulateSelectedReinvestment(bond, availableAmount);
      });

      container.appendChild(bondDiv);
    });
  }

  // Simulate reinvestment for selected bond
  function simulateSelectedReinvestment(bond, availableAmount) {
    const currentDate = new Date();
    const simulationRate = bond.type === "selic" ? 13.75 : bond.rate; // Assume Selic at 13.75% for simulation

    const result = calculator.simulateReinvestment(
      availableAmount,
      simulationRate,
      currentDate.toISOString().split("T")[0],
      bond.maturityDate
    );

    // Display results
    document.getElementById("reinvestAmount").textContent =
      calculator.formatCurrency(result.investedAmount);
    document.getElementById("reinvestFutureValue").textContent =
      calculator.formatCurrency(result.netFutureValue);
    document.getElementById("reinvestReturn").textContent =
      calculator.formatCurrency(result.returns) +
      ` (em ${result.years.toFixed(1)} anos)`;

    document.getElementById("reinvestmentResults").style.display = "block";
  }

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  }

  // Add listener to update calculations when market rate changes
  document.getElementById("marketRate").addEventListener("change", function () {
    if (resultsDiv.style.display !== "none") {
      calculateInvestment();
    }
  });
});

// Console log for debugging
console.log("Calculadora de Tesouro Direto carregada com sucesso!");
console.log("Pronta para realizar cálculos de investimentos.");
