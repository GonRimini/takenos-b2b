"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HelpCircle, Mail, Phone, Clock, CreditCard, Banknote, Shield, AlertTriangle } from "lucide-react"

export default function AyudaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

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
                      <div className="text-sm text-muted-foreground">soporte@takenos.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Teléfono</div>
                      <div className="text-sm text-muted-foreground">+1 (555) 123-4567</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Horario</div>
                      <div className="text-sm text-muted-foreground">Lun-Vie 9:00-18:00</div>
                    </div>
                  </div>

                  <Button className="w-full mt-4">
                    <Mail className="mr-2 h-4 w-4" />
                    Contactar Soporte
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
                        Los límites dependen del método de depósito y tu tipo de cuenta. Contacta a nuestro equipo de
                        soporte para conocer los límites específicos de tu cuenta.
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
                        Las solicitudes de retiro se procesan de lunes a viernes durante horario hábil. El tiempo de
                        procesamiento depende del método seleccionado:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>
                            <strong>Estándar:</strong> 2-3 días hábiles
                          </li>
                          <li>
                            <strong>Acelerado:</strong> 1 día hábil (tarifa adicional de $10 USD)
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

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Seguridad y Verificación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="security-1">
                      <AccordionTrigger>¿Cómo protegen mi información financiera?</AccordionTrigger>
                      <AccordionContent>
                        Utilizamos encriptación de nivel bancario y cumplimos con los más altos estándares de seguridad.
                        Tu información está protegida con tecnología SSL de 256 bits y nunca almacenamos información
                        sensible como contraseñas bancarias.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security-2">
                      <AccordionTrigger>¿Necesito verificar mi identidad?</AccordionTrigger>
                      <AccordionContent>
                        Por regulaciones de seguridad financiera, es posible que necesites verificar tu identidad para
                        ciertas transacciones. Te notificaremos si se requiere documentación adicional.
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
