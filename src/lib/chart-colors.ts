// Validated categorical palette (light mode). Each series keeps its colour on every chart.
// Lives outside the "use client" chart file so server pages can read it too.
export const SERIES = {
  sales: { label: "Sales", color: "#2a78d6" },
  profit: { label: "Profit", color: "#eb6834" },
  expenses: { label: "Expenses", color: "#1baf7a" },
} as const;
