import { BookOpen, Boxes, History, Plus, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Secciones de la app. "Capturar" no es una sección: es la acción principal y
// se dibuja aparte (botón central en móvil, botón destacado en la sidebar).
export const sections: NavItem[] = [
  { href: "/", label: "Inventario", icon: Boxes },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/catalogo", label: "Catálogo", icon: BookOpen },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export const captureAction: NavItem = { href: "/capturar", label: "Capturar", icon: Plus };

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
