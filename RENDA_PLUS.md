# Funcionalidade Renda+ Implementada ✅

## O que foi adicionado:

### 1. HTML (`index.html`)

- Adicionada nova linha para exibir "Pagamento Mensal (20 anos)"
- A linha fica oculta por padrão e só aparece para títulos Renda+

### 2. Calculator (`calculator.js`)

- Nova função: `calculateMonthlyPayment(totalValue)`
- Divide o valor total por 240 meses (20 anos)

### 3. UI (`ui.js`)

- Atualizada função `displayReinvestmentResults()` para aceitar parâmetro `isRendaMais`
- Mostra/oculta a linha de pagamento mensal dinamicamente
- Formata o valor mensal em BRL

### 4. App (`app.js`)

- Detecta títulos Renda+ pelo nome (contém "Renda+" ou "Aposentadoria Extra")
- Calcula o pagamento mensal automaticamente
- Passa a informação para o UI

## Como funciona:

1. Usuário seleciona um título Renda+ (ex: "Tesouro Renda+ Aposentadoria Extra 2030")
2. Sistema calcula o valor futuro total
3. Sistema divide por 240 meses (20 anos)
4. Exibe: "💰 Pagamento Mensal (20 anos): R$ X.XXX,XX"

## Exemplo:

- Valor Futuro Estimado: R$ 240.000,00
- Pagamento Mensal: R$ 1.000,00 (por 20 anos)

## Títulos afetados:

Todos os títulos com nome contendo:

- "Renda+"
- "Aposentadoria Extra"

Estes títulos têm `interestType: "M"` (mensal) na API.
