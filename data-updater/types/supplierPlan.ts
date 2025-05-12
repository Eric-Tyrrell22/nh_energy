export interface SupplierPlan {
  supplier_name?: string | null;
  plan_name?: string | null;
  pricing_type?: string | null;
  is_intro_price?: boolean | null;
  has_cancellation_fee?: boolean | null;
  price_per_kwh?: number | null;
  last_updated?: Date | null;
  percent_renewable?: number | null;
  is_monthly_charge?: boolean | null;
  rate_is_good_for?: string | null;
  rate_end?: string | null;
  comments?: string | null;
  link?: string | null;
}
