export const calculateItemTotal = (rate: number, qty: number, freq: "weekly" | "fortnightly" | "monthly" | "once", totalWeeks: number) => {
  const factor = freq === "weekly" ? 1 : freq === "fortnightly" ? 0.5 : freq === "monthly" ? 0.23 : 0;
  if (freq === "once") return rate * qty;
  return rate * qty * (totalWeeks * factor);
};
