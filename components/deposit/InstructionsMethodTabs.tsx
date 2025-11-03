"use client";

import { DepositMethod } from "@/hooks/deposits/useDepositInstructions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";

interface InstructionsMethodTabsProps {
  selectedMethod: DepositMethod;
  onMethodChange: (method: DepositMethod) => void;
  loading: boolean;
  error: string | null;
  hasData: boolean;
  userEmail: string;
  renderContent: (method: DepositMethod) => React.ReactNode;
}

export default function InstructionsMethodTabs({
  selectedMethod,
  onMethodChange,
  loading,
  error,
  hasData,
  userEmail,
  renderContent,
}: InstructionsMethodTabsProps) {
  const renderDepositContent = (method: DepositMethod) => {
    return (
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            Información para{" "}
            {method === "ach"
              ? "ACH/WIRE"
              : method === "crypto"
              ? "CRYPTO"
              : method === "local"
              ? "MONEDA LOCAL"
              : method.toUpperCase()}
          </CardTitle>
          <CardDescription>Utiliza estos datos para realizar tu depósito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Error cargando datos: {error}</span>
            </div>
          ) : !hasData ? (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No se encontraron datos para {userEmail}</span>
            </div>
          ) : (
            renderContent(method)
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Método de depósito</CardTitle>
        <CardDescription>Elige el tipo de transferencia que utilizarás</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs
          value={selectedMethod}
          onValueChange={(value) => onMethodChange(value as DepositMethod)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="ach"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
            >
              ACH/Wire
            </TabsTrigger>
            <TabsTrigger
              value="swift"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
            >
              SWIFT
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
            >
              Crypto
            </TabsTrigger>
            <TabsTrigger
              value="local"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6d37d5] data-[state=active]:bg-transparent data-[state=active]:text-[#6d37d5] data-[state=active]:shadow-none"
            >
              Moneda Local
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="ach" className="mt-0">
              {renderDepositContent("ach")}
            </TabsContent>

            <TabsContent value="swift" className="mt-0">
              {renderDepositContent("swift")}
            </TabsContent>

            <TabsContent value="crypto" className="mt-0">
              {renderDepositContent("crypto")}
            </TabsContent>

            <TabsContent value="local" className="mt-0">
              {renderDepositContent("local")}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

