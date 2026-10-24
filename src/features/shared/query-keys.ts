// Llaves de TanStack Query que varias features invalidan entre sí.
export const queryKeys = {
  catalog: ["catalog", "list"] as const,
  inventory: ["inventory", "list"] as const,
  history: ["history", "list"] as const,
  members: ["members", "list"] as const,
};
