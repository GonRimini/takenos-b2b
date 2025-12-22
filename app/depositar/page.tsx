"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth";
import { logAuditEvent } from "@/lib/audit/client";
import DepositMainTabs from "@/components/deposit/DepositMainTabs";

export default function DepositarPage() {
  const { user } = useAuth();

  // Audit log: deposit flow started
  useEffect(() => {
    // Solo loguear cuando ya existe user completo con dbUser
    if (!user?.id || !user?.email || !user?.dbUser) return;

    // Evitar múltiples registros usando sessionStorage
    const sessionKey = `audit_deposit_flow_${user.id}`;
    const alreadyLogged = sessionStorage.getItem(sessionKey);
    
    if (!alreadyLogged) {
      sessionStorage.setItem(sessionKey, "true");
      
      logAuditEvent({
        action: "deposit.flow_started",
        metadata: { 
          page: "depositar",
          user_email: user.email,
          user_name: user.dbUser.name || null,
          user_last_name: user.dbUser.last_name || null,
          company_name: user.dbUser.company?.name || null,
          nationality: user.dbUser.nationality || null,
        },
        user_id: user.id,
        company_id: user.dbUser.company_id || null,
      });
    }
  }, [user?.id, user?.email, user?.dbUser]);

  return <DepositMainTabs />;
}
