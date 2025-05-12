// This interface matches the structure of your JSON data
export interface RawEnergyPlan {
  supplier_name?: string | null;
  plan_name?: string | null;
  price_per_kwh?: number | null;
  last_updated?: string | null; // ISO date string from JSON
  pricing_type?: "Fixed" | "Variable" | string | null; // Allow string for flexibility from source
  is_monthly_charge?: boolean | null;
  is_intro_price?: boolean | null;
  has_cancellation_fee?: boolean | null;
  percent_renewable?: number | null;
  rate_is_good_for?: string | null;
  rate_end?: string | null;
  comments?: string | null;
  link?: string | null;
}

// This is the type we'll use within the application after processing
export interface EnergyPlan {
  supplier_name: string; // Default to empty string if null/undefined
  plan_name: string;   // Default to empty string
  price_per_kwh: number | null; // Keep null if no price
  last_updated: Date | null;    // Parsed Date object
  pricing_type: "Fixed" | "Variable" | "Unknown"; // Normalize
  is_monthly_charge: boolean;     // Default to false
  is_intro_price: boolean;        // Default to false
  has_cancellation_fee: boolean;  // Default to false
  percent_renewable: number;      // Default to 0
  rate_is_good_for: string;       // Default to empty string
  rate_is_good_for_months: number; // Parsed numeric value for sorting/filtering
  rate_end: string;               // Default to empty string
  comments: string;               // Default to empty string
  link: string;
}
