// Datos fijos del historial hasta tener history-api.ts.
import type { Movement } from "./types/movement";

export const movements: Movement[] = [
  { id: "m1", productName: "Harina de arroz", type: "entrada", quantity: 50, unit: "kg", source: "foto", userName: "Bryan Alberto", time: "Hoy, 9:42" },
  { id: "m2", productName: "Queso crema", type: "entrada", quantity: 4.5, unit: "kg", source: "audio", userName: "Bryan Alberto", time: "Hoy, 9:42" },
  { id: "m3", productName: "Fresa", type: "uso", quantity: -3, unit: "kg", source: "texto", userName: "Andrea", time: "Hoy, 8:15" },
  { id: "m4", productName: "Matcha", type: "uso", quantity: -0.4, unit: "kg", source: "audio", userName: "Andrea", time: "Ayer, 17:30" },
  { id: "m5", productName: "Mantequilla", type: "perdida", quantity: -0.5, unit: "kg", source: "texto", userName: "Andrea", time: "Ayer, 16:05" },
];
