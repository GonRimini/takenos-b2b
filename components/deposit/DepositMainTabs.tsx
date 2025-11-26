"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { AlertCircle } from "lucide-react";
import DepositInstructionsSection from "./DepositInstructionsSection";
import DepositFormWizard from "./DepositFormWizard";

export type MainSection = "instructions" | "inform";

export default function DepositMainTabs() {
  const [mainSection, setMainSection] = useState<MainSection>("instructions");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Depósitos</h1>
        <p className="text-muted-foreground">
          Gestiona tus depósitos: consulta instrucciones o informa un depósito
          realizado
        </p>
      </div>

      <Tabs
        value={mainSection}
        onValueChange={(value) => setMainSection(value as MainSection)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="instructions"
            className="data-[state=active]:bg-[#6d37d5] data-[state=active]:text-white hover:bg-[#f3ecff] hover:text-[#6d37d5]"
          >
            Ver Instrucciones
          </TabsTrigger>
          <TabsTrigger
            value="inform"
            className="data-[state=active]:bg-[#6d37d5] data-[state=active]:text-white hover:bg-[#f3ecff] hover:text-[#6d37d5]"
          >
            Informar Depósito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-4">
          <DepositInstructionsSection />
        </TabsContent>

        <TabsContent value="inform" className="space-y-4">
          <DepositFormWizard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

