import { User, Session, AuthError } from "@supabase/supabase-js";

// 👇 agregá esto
export interface DbUser {
    id: string;
    email: string;
    name: string;
    last_name: string;
    company_id: string;
    company: {
      id: string;
      name: string;
      country_code: string;
      // otros campos de la tabla companies si los necesitás
    } | null;
    nationality: string;
    // después le agregás los campos reales de tu tabla public.users
    [key: string]: unknown;
  }
  
  export type EnrichedUser = User & {
    dbUser?: DbUser; // acá va lo que viene de public.users
  };
