"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountFormACH from "./AccountFormACH";
import AccountFormSwift from "./AccountFormSwift";
import AccountFormCrypto from "./AccountFormCrypto";
import AccountFormLocal from "./AccountFormLocal";
import { useState } from "react";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface Props {
  userEmail?: string;
  onCreated: () => Promise<void> | void;
  onCancel: () => void;
}

export default function CreateDepositAccountPanel({ userEmail, onCreated, onCancel }: Props) {
  const [newAccountMethod, setNewAccountMethod] = useState<DepositMethod | undefined>(undefined);

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Crear nueva cuenta</CardTitle>
        <CardDescription>Elegí el método y completá los datos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={newAccountMethod} onValueChange={(v) => setNewAccountMethod(v as DepositMethod)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ach">ACH/Wire</TabsTrigger>
            <TabsTrigger value="swift">SWIFT</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="local">Moneda Local</TabsTrigger>
          </TabsList>
          <div className="pt-4">
            <TabsContent value="ach">
              <AccountFormACH userEmail={userEmail} onSaved={onCreated} onCancel={onCancel} />
            </TabsContent>
            <TabsContent value="swift">
              <AccountFormSwift userEmail={userEmail} onSaved={onCreated} onCancel={onCancel} />
            </TabsContent>
            <TabsContent value="crypto">
              <AccountFormCrypto userEmail={userEmail} onSaved={onCreated} onCancel={onCancel} />
            </TabsContent>
            <TabsContent value="local">
              <AccountFormLocal userEmail={userEmail} onSaved={onCreated} onCancel={onCancel} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}


