export type Role = "admin" | "base";

export type CurrentUser = {
  name: string;
  initials: string;
  role: Role;
};

export type Business = {
  name: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minimum: number;
  aliases: string[];
};

export type StockStatus = "ok" | "low" | "out";
