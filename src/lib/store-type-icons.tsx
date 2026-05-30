import {
  Store,
  ShoppingBasket,
  ShoppingCart,
  Warehouse,
  Pill,
  Sparkles,
  Smartphone,
  Shirt,
  Scissors,
  Wrench,
  UtensilsCrossed,
  Boxes,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const STORE_TYPE_ICONS: Record<string, LucideIcon> = {
  kirana: Store,
  grocery: ShoppingBasket,
  supermarket: ShoppingCart,
  wholesale: Warehouse,
  pharmacy: Pill,
  "drug store": Pill,
  cosmetics: Sparkles,
  electronics: Smartphone,
  apparel: Shirt,
  salon: Scissors,
  hardware: Wrench,
  food_outlet: UtensilsCrossed,
  others: Boxes,
  unknown: HelpCircle,
};

export function iconForStoreType(t: string | null | undefined): LucideIcon {
  if (!t) return HelpCircle;
  return STORE_TYPE_ICONS[t] ?? Boxes;
}
