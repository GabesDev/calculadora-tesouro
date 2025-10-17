# 💰 Calculadora de Tesouro Direto

Eu queria responder uma pergunta rápidamente: Será que é um bom momento para vender meus títulos do Tesouro Direto?
Porém, não encontrei nenhuma ferramenta simples que me ajudasse com isso.

Então, ao invés de levar 20 minutos pra consultar, decidi gastar 2 horas criando esta calculadora simples.
Espero que seja útil para você também!

## 🚀 Início Rápido

### 🌟 Acesso Online

```
https://tesouro.gabes.dev/
```

**Vantagens:**

- ✅ **Sem problemas de CORS** - API funciona 100%
- ✅ **Dados em tempo real** da API oficial
- ✅ **20+ títulos** sempre atualizados
- ✅ **Performance otimizada** com CDN global
- ✅ **HTTPS seguro** incluso
- ✅ **Deploy automatizado** via Netlify

---

## 📊 Funcionalidades

### 1. Cálculo de Valor no Vencimento

- Valor bruto com juros compostos
- Imposto de Renda (tabela regressiva)
- Valor líquido final
- Rendimento total

### 2. Marcação a Mercado

- Valor presente do título
- Ajuste por taxa de mercado atual
- Ganho/perda até o momento
- Simulação de venda antecipada

### 3. Simulação de Reinvestimento

- Carregamento automático de títulos disponíveis
- Comparação de cenários
- Cálculo de rendimento futuro
- Interface visual interativa

### 4. Integração com API

- Busca automática de dados oficiais
- Atualização em tempo real
- Sistema de fallback inteligente
- Feedback visual de status

---

## 🔧 Tecnologias

- **Frontend**: HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript ES6+
- **API**: Tesouro Transparente (CKAN) com proxy CORS
- **Deploy**: Netlify (tesouro.gabes.dev)
- **Arquitetura**: OOP com classe TreasuryCalculator

---

## 📖 Uso

### Pré-configuração

A calculadora vem pré-configurada com dados de exemplo:

- Título: Tesouro Prefixado 2029
- Valor: R$ 10.000,00
- Taxa: 11,99% a.a.
- Data investimento: 01/10/2022
- Vencimento: 01/01/2029

### Passo a Passo

1. **Abra a calculadora** (com servidor ou diretamente)
2. **Ajuste os campos** (opcional, já vem preenchido)
3. **Informe a taxa de mercado atual** (consulte site do Tesouro)
4. **Clique em "Calcular"**
5. **Analise os 3 resultados**:
   - Valor no vencimento
   - Valor atual (marcação a mercado)
   - Opções de reinvestimento

---

## 🧮 Metodologia de Cálculo

### Juros Compostos

```
VF = VP × (1 + i)^n
```

- VF = Valor Futuro
- VP = Valor Presente
- i = Taxa de juros (decimal)
- n = Período em anos

### Marcação a Mercado

```
VP = VF / (1 + i_mercado)^n_restante
```

- Desconta o valor futuro pela taxa atual do mercado
- Reflete o valor real do título hoje

### Imposto de Renda

| Período           | Alíquota |
| ----------------- | -------- |
| Até 180 dias      | 22,5%    |
| 181-360 dias      | 20,0%    |
| 361-720 dias      | 17,5%    |
| Acima de 720 dias | 15,0%    |

_Incide apenas sobre o rendimento_

---

## 🔒 Considerações Importantes

### Limitações

1. **Estimativas**: Valores são aproximações educacionais
2. **Custos não incluídos**:
   - Taxa de custódia B3 (0,20% a.a.)
   - Taxa da corretora (se aplicável)
3. **IOF**: Não calculado (apenas em resgates < 30 dias)
4. Usei um dos tesouros que escolhi (Prefixado 2029) para estimar as taxas iniciais
