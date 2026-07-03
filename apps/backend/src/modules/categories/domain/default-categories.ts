export type DefaultCategory = {
  name: string;
  children: string[];
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "food", children: ["fast food", "grocery"] },
  { name: "transport", children: ["taxi", "bus"] },
  { name: "utilities", children: ["water", "electricity", "internet"] },
  { name: "health", children: [] },
];
