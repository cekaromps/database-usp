export const ECOM_CATEGORIES = [
  {
    value: "MATERIALS",
    label: "Materials",
    subOptions: ["Steel", "Plastic", "Fibre"],
  },
  {
    value: "TOOLING",
    label: "Tooling",
    subOptions: ["Drill", "Endmill", "Abrasive"],
  },
  {
    value: "STANDARD_PART",
    label: "Standard Part",
    subOptions: ["Pneumatic", "Electrical", "Mechanical"],
  },
] as const;

export type EcomCategoryValue = (typeof ECOM_CATEGORIES)[number]["value"];

export const ECOM_CATEGORY_VALUES = ECOM_CATEGORIES.map((c) => c.value);

export function isValidEcomCategory(value: string): value is EcomCategoryValue {
  return (ECOM_CATEGORY_VALUES as string[]).includes(value);
}

export function getCategoryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return ECOM_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getSubOptions(category: string | null | undefined): readonly string[] {
  if (!category) return [];
  return ECOM_CATEGORIES.find((c) => c.value === category)?.subOptions ?? [];
}
