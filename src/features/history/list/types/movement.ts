export type Movement = {
  id: string;
  productName: string;
  type: "entrada" | "uso" | "perdida" | "ajuste";
  quantity: number;
  unit: string;
  source: "foto" | "audio" | "texto";
  userName: string;
  time: string;
};
