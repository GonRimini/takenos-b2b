export interface Company {
  id: string;
  name: string | null;
  notes: string | null;
  retool_lookup_email: string | null;
  created_at: string;
}

export interface CompanyLimit {
  id: string;
  company_id: string | null;
  limit_amount: number | null;
  consumed_amount: number | null;
  remaining_amount: number | null;
  currency_code: string | null;
  period_type: string | null;
  reset_date: string | null;
  last_update: string | null;
  created_at: string;
}