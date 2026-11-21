export const STATUS_LABELS = {
    ON_PROCESS: "On Process",
    READY_DELIVERY: "Ready Delivery",
    DELIVERY: "Delivery",
    CLOSE: "Close",
}

// Production: forward steps, never CLOSE
export const PRODUCTION_NEXT: Record<DespactStatus, DespactStatus[]> = {
  ON_PROCESS: ["READY_DELIVERY"],
  READY_DELIVERY: ["DELIVERY"],
  DELIVERY: [],
  CLOSE: [],
};

// Finance: only close, and only from DELIVERY
export const FINANCE_NEXT: Record<DespactStatus, DespactStatus[]> = {
  ON_PROCESS: [],
  READY_DELIVERY: [],
  DELIVERY: ["CLOSE"],
  CLOSE: [],
};

export type DespactStatus = keyof typeof STATUS_LABELS;
export const STATUS_VALUES = Object.keys(STATUS_LABELS) as DespactStatus[];