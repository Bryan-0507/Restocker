import { HistoryList } from "@/features/history/list/components/history-list";

export default async function HistorialPage({ searchParams }: PageProps<"/historial">) {
  // /historial?producto=<id> muestra solo los cambios de ese producto.
  const { producto } = await searchParams;
  const productId = typeof producto === "string" ? producto : undefined;

  return <HistoryList key={productId ?? "todo"} productId={productId} />;
}
