"use client"

import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HelpCircle, Mail, Phone, Clock, CreditCard, Banknote, AlertTriangle } from "lucide-react"

export default function AyudaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Centro de Ayuda</h1>
            <p className="text-lg text-muted-foreground">
              Encuentra respuestas a las preguntas más frecuentes sobre depósitos y retiros
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Card className="rounded-2xl shadow-lg sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Contacto
                  </CardTitle>
                  <CardDescription>¿Necesitas ayuda personalizada?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Email</div>
                      <div className="text-sm text-muted-foreground">fermin@takenos.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Teléfono</div>
                      <div className="text-sm text-muted-foreground">+54 9 11 6563-7616</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Horario</div>
                      <div className="text-sm text-muted-foreground">24/7</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => window.open('https://wa.me/5491165637616', '_blank')}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Hablar con Fermín
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Preguntas sobre Depósitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="deposit-1">
                      <AccordionTrigger>¿Cuánto tiempo tarda en procesarse un depósito?</AccordionTrigger>
                      <AccordionContent>
                        Los tiempos de procesamiento varían según el método:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>
                            <strong>ACH:</strong> 1-3 días hábiles
                          </li>
                          <li>
                            <strong>Wire Transfer:</strong> Mismo día o siguiente día hábil
                          </li>
                          <li>
                            <strong>RTP:</strong> Inmediato (24/7)
                          </li>
                          <li>
                            <strong>SWIFT:</strong> 1-5 días hábiles (internacional)
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="deposit-2">
                      <AccordionTrigger>¿Hay límites mínimos o máximos para depósitos?</AccordionTrigger>
                      <AccordionContent>
                        Podés consultar tus límites con el equipo de Takenos. Es posible iniciar una solicitud de extensión de límites.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="deposit-3">
                      <AccordionTrigger>¿Qué información debo incluir en la transferencia?</AccordionTrigger>
                      <AccordionContent>
                        Asegúrate de incluir toda la información bancaria proporcionada en las instrucciones de
                        depósito. Para transferencias internacionales, puede ser necesaria información adicional como el
                        propósito de la transferencia.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-accent" />
                    Preguntas sobre Retiros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="withdrawal-1">
                      <AccordionTrigger>¿Cuándo se procesará mi solicitud de retiro?</AccordionTrigger>
                      <AccordionContent>
                        La solicitud de retiro se genera inmediatamente. El procesamiento del mismo se realiza los días hábiles en horarios bancarios.
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>
                            <strong>ACH:</strong> 2-3 días hábiles
                          </li>
                          <li>
                            <strong>Wire Transfer:</strong> 1-2 días hábiles
                          </li>
                          <li>
                            <strong>Crypto BEP20/MATIC:</strong> Instantáneo
                          </li>
                          <li>
                            <strong>Crypto TRC20:</strong> 4 días hábiles
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="withdrawal-2">
                      <AccordionTrigger>¿Puedo cancelar una solicitud de retiro?</AccordionTrigger>
                      <AccordionContent>
                        Las solicitudes de retiro pueden cancelarse únicamente antes de ser procesadas. Contacta
                        inmediatamente a nuestro equipo de soporte si necesitas cancelar una solicitud.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="withdrawal-3">
                      <AccordionTrigger>¿Qué hago si mi retiro fue rechazado?</AccordionTrigger>
                      <AccordionContent>
                        Los retiros pueden ser rechazados por información bancaria incorrecta o insuficientes fondos.
                        Recibirás un email con el motivo del rechazo y podrás enviar una nueva solicitud con la
                        información corregida.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>



              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Nunca compartas tu información de acceso con terceros. Takenos nunca te
                  solicitará contraseñas o información sensible por email o teléfono.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
