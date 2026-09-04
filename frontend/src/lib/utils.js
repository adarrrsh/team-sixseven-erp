export { cn } from "cn"

export const inr = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })

export const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

export const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100))
