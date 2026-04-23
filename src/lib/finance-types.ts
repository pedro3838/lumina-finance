export type Person = "Pedro" | "Maria" | "Empresa";

export type IncomeStatus = "recebido" | "pendente";
export type ExpenseStatus = "pago" | "pendente";

export type ExpenseType = "fixo" | "variavel" | "investimento" | "superfluo" | "imprevisto";
export type PaymentMethod = "pix" | "credito" | "debito" | "boleto" | "dinheiro" | "transferencia";
export type Classification = "ATIVO" | "PASSIVO";

export interface Income {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  amount: number;
  status: IncomeStatus;
  person: Person;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  type: ExpenseType;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  plannedAmount: number;
  actualAmount: number;
  status: ExpenseStatus;
  person: Person;
  createdAt: string;
}

export type SaleStatus = "rascunho" | "enviado" | "aprovado" | "concluido" | "cancelado";

export interface Sale {
  id: string;
  date: string;
  client: string;
  city: string;
  product: string;
  cost: number;
  quantity: number;
  marginPercent: number;
  commissionPercent: number;
  status: SaleStatus;
  person: Person;
  createdAt: string;
}

export interface SaleCalculations {
  markup: number;
  unitPrice: number;
  totalValue: number;
  totalCost: number;
  commissionAmount: number;
  grossProfit: number;
  netProfit: number;
}

export const INCOME_CATEGORIES = [
  "Salário",
  "Vendas",
  "Freelance",
  "Investimentos",
  "Aluguel",
  "Comissões",
  "Outros",
];

export const EXPENSE_CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Impostos",
  "Investimentos",
  "Outros",
];

export const PEOPLE: Person[] = ["Pedro", "Maria", "Empresa"];

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  fixo: "Fixo",
  variavel: "Variável",
  investimento: "Investimento",
  superfluo: "Supérfluo",
  imprevisto: "Imprevisto",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
};

// Investments are classified as ATIVO; everything else is PASSIVO
export function classifyExpense(type: ExpenseType): Classification {
  return type === "investimento" ? "ATIVO" : "PASSIVO";
}

export function calcSale(sale: Pick<Sale, "cost" | "quantity" | "marginPercent" | "commissionPercent">): SaleCalculations {
  const totalCost = sale.cost * sale.quantity;
  // Markup = price / cost; price derived from margin (margin = profit/price)
  // unitPrice = cost / (1 - margin/100)
  const m = Math.min(Math.max(sale.marginPercent, 0), 99.9) / 100;
  const unitPrice = m >= 1 ? sale.cost : sale.cost / (1 - m);
  const totalValue = unitPrice * sale.quantity;
  const markup = sale.cost > 0 ? unitPrice / sale.cost : 0;
  const grossProfit = totalValue - totalCost;
  const commissionAmount = grossProfit * (sale.commissionPercent / 100);
  const netProfit = grossProfit - commissionAmount;
  return { markup, unitPrice, totalValue, totalCost, commissionAmount, grossProfit, netProfit };
}
