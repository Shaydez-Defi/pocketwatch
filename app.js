//mock transaction data
const sampleTransactions = [
  {date: "2024-01-15", type: "transfer", amount: 100, fee: 0.005, currency: "ETH"},
  {date: "2024-01-16", type: "swap", amount: 50, fee: 0.0012, currency: "ETH"},
  {date: "2024-01-17", type: "transfer", amount: 200, fee: 0.008, currency: "ETH"},
  {date: "2024-02-01", type: "transfer", amount: 75, fee: 0.015, currency: "ETH"},
  {date: "2024-02-14", type: "swap", amount: 300, fee: 0.022, currency: "ETH"}
];

const SUI_AVG_FEE = 0.001;

const ETH_PRICE = 3000;

function calculateTotalFees(transactions) {
  return transactions.reduce((total, txn) => {
    return total + (txn.fee * ETH_PRICE);
  }, 0);
}

function calculateSuiSavings(transactions) {
  const totalSuiFees = transactions.length * SUI_AVG_FEE;
  const totalFeesUSD = calculateTotalFees(transactions);
  const savings = totalFeesUSD - totalSuiFees;
  
  return {
    totalFeesUSD: totalFeesUSD,
    totalSuiFees: totalSuiFees,
    savings: savings
  };
}

const result = calculateSuiSavings(sampleTransactions);

console.log("Total fees paid: $" + result.totalFeesUSD.toFixed(2));
console.log("What Sui would have charged: $" + result.totalSuiFees.toFixed(2));
console.log("You would have saved: $" + result.savings.toFixed(2));

function parseCSV (csvTEXT) {
  const lines = csvTEXT.split("\n");
  const headers = lines[0].split(",");

  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "") continue;

    const values = lines[i].split(",");
    const txn = {
      date: values[0],
      type: values[1],
      amount: parseFloat(values[2]),
      fee: parseFloat(values[3]),
      currency: values[4]
    };
    transactions.push(txn);
  }

  return transactions;
}

document.getElementById("csvUpload").addEventListener("change", function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const csvText = e.target.result;
    const transactions = parseCSV(csvText);
    const result = calculateSuiSavings(transactions);
    
    document.getElementById("results").innerHTML = `
      <p>Total fees paid: $${result.totalFeesUSD.toFixed(2)}</p>
      <p>What Sui would have charged: $${result.totalSuiFees.toFixed(2)}</p>
      <p>You would have saved: $${result.savings.toFixed(2)}</p>
    `;
  };
  
  reader.readAsText(file);
});