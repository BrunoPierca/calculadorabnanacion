"use client"

import React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchExchangeRate } from "@/lib/exchange-rate"
import { DESTINOS, valorInicialUVA } from "@/lib/bna-mortgage"
import { useBnaMortgage } from "@/hooks/use-bna-mortgage"
import type { Destino } from "@/lib/bna-mortgage"

const DESTINO_LABELS: Record<Destino, string> = {
  [DESTINOS.ADQ1]: "Adquisición / cambio vivienda única",
  [DESTINOS.CONST1]: "Construcción vivienda única",
  [DESTINOS.CONST2]: "Construcción de segunda vivienda",
  [DESTINOS.AMP1]: "Ampliación / refacción / terminación viv. única",
  [DESTINOS.AMP2]: "Ampliación / refacción / terminación segunda vivienda",
  [DESTINOS.ADQ2]: "Adquisición segunda vivienda",
}

export default function PropertyConverter() {
  const [exchangeRate, setExchangeRate] = useState(1500)
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState("1.500")
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false)
  const [propertyPriceUSD, setPropertyPriceUSD] = useState<number | "">("")
  const [propertyPriceDisplay, setPropertyPriceDisplay] = useState("")
  const [downpaymentValue, setDownpaymentValue] = useState<number | "">("")
  const [downpaymentDisplay, setDownpaymentDisplay] = useState("")
  const [downpaymentCurrency, setDownpaymentCurrency] = useState<"ARS" | "USD">("ARS")

  const [mortgageLoanAmountDisplay, setMortgageLoanAmountDisplay] = useState("")
  const [destino, setDestino] = useState<Destino>(DESTINOS.ADQ1)
  const [plazo, setPlazo] = useState(10)
  const [cobraHaberesBNA, setCobraHaberesBNA] = useState<"Si" | "No">("Si")
  const [adhiereOpcionTopeCVS, setAdhiereOpcionTopeCVS] = useState<"Si" | "No">("Si")
  const [planDeCuotasOpen, setPlanDeCuotasOpen] = useState(false)

  const handleRefreshRate = useCallback(async () => {
    setExchangeRateLoading(true)
    try {
      const rate = await fetchExchangeRate()
      setExchangeRate(rate)
      setExchangeRateDisplay(new Intl.NumberFormat("de-DE").format(rate))
    } finally {
      setExchangeRateLoading(false)
    }
  }, [])

  const propertyPriceARS = propertyPriceUSD !== "" ? propertyPriceUSD * exchangeRate : 0

  const downpaymentInARS = downpaymentValue !== ""
    ? (downpaymentCurrency === "USD" ? downpaymentValue * exchangeRate : downpaymentValue)
    : 0

  const downpaymentInUSD = downpaymentValue !== ""
    ? (downpaymentCurrency === "USD" ? downpaymentValue : downpaymentValue / exchangeRate)
    : 0

  const coveragePercent = propertyPriceARS > 0
    ? Math.min((downpaymentInARS / propertyPriceARS) * 100, 100)
    : 0

  const remainingARS = Math.max(propertyPriceARS - downpaymentInARS, 0)
  const remainingUSD = Math.max((propertyPriceUSD || 0) - downpaymentInUSD, 0)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("de-DE").format(Math.round(num))
  }

  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/\./g, "")
    return Number(cleaned) || 0
  }

  const formatInputValue = (value: string): string => {
    const cleaned = value.replace(/\./g, "").replace(/[^\d]/g, "")
    if (!cleaned) return ""
    return new Intl.NumberFormat("de-DE").format(Number(cleaned))
  }

  const loanAmountARS = mortgageLoanAmountDisplay
    ? parseFormattedNumber(mortgageLoanAmountDisplay)
    : remainingARS

  const mortgageResult = useBnaMortgage({
    valorViviendaPesos: propertyPriceARS,
    montoPrestamoPesos: loanAmountARS,
    plazo,
    destino,
    cobraHaberesBNA,
    adhiereOpcionTopeCVS,
    zonaPatagonica: "No",
  })

  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value)
    setExchangeRateDisplay(formatted)
    setExchangeRate(parseFormattedNumber(formatted))
  }

  const handlePropertyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value)
    setPropertyPriceDisplay(formatted)
    setPropertyPriceUSD(formatted ? parseFormattedNumber(formatted) : "")
  }

  const handleDownpaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value)
    setDownpaymentDisplay(formatted)
    setDownpaymentValue(formatted ? parseFormattedNumber(formatted) : "")
  }

  const handleMortgageLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value)
    setMortgageLoanAmountDisplay(formatted)
  }

  const progressBarColor = coveragePercent >= 25 ? "bg-green-500" : "bg-red-500"

  const canShowMortgage =
    propertyPriceARS > 0 && loanAmountARS > 0 && mortgageResult.plazoOptions.includes(plazo)

  useEffect(() => {
    if (mortgageResult.topeCVSDisabled && adhiereOpcionTopeCVS === "Si") {
      setAdhiereOpcionTopeCVS("No")
    }
  }, [mortgageResult.topeCVSDisabled, adhiereOpcionTopeCVS])

  useEffect(() => {
    if (
      mortgageResult.plazoOptions.length > 0 &&
      !mortgageResult.plazoOptions.includes(plazo)
    ) {
      setPlazo(mortgageResult.plazoOptions[0])
    }
  }, [destino, mortgageResult.plazoOptions, plazo])

  return (
    <main className="min-h-dvh bg-background p-4 md:p-6 overflow-auto">
      <header className="pb-6">
        <h1 className="text-2xl font-bold text-foreground">Calculadora de Crédito UVA (BNA)</h1>
      </header>
      <div className="mx-auto grid h-full gap-4 md:grid-cols-5">

        {/* Left column: inputs */}
        <div className="flex flex-col gap-4">
          {/* Exchange Rate */}
          <Card id="exchange-rate">
            <CardHeader className="">
              <CardTitle className="text-base">Tipo de cambio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground">1 USD =</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={exchangeRateDisplay}
                  onChange={handleExchangeRateChange}
                  className="w-32"
                />
                <span className="text-muted-foreground">ARS</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshRate}
                  disabled={exchangeRateLoading}
                >
                  {exchangeRateLoading ? "Loading…" : "Refresh rate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Property Price */}
          <Card id="property-price">
            <CardHeader className="">
              <CardTitle className="text-base">Precio de la propiedad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="property-price-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="100.000"
                    value={propertyPriceDisplay}
                    onChange={handlePropertyPriceChange}
                  />
                  <span className="text-muted-foreground">USD</span>
                </div>
              </div>
              {propertyPriceUSD !== "" && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Equivalente en Pesos</p>
                  <p className="text-xl font-bold text-foreground">
                    $ {formatNumber(propertyPriceARS)} ARS
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Downpayment */}
          <Card id="downpayment">
            <CardHeader className="">
              <CardTitle className="text-base">Anticipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="downpayment-input">Monto</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="downpayment-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="25.000"
                    value={downpaymentDisplay}
                    onChange={handleDownpaymentChange}
                    className="flex-1"
                  />
                  <Select value={downpaymentCurrency} onValueChange={(v: string) => setDownpaymentCurrency(v as "ARS" | "USD")}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {downpaymentValue !== "" && (
                <div className="grid gap-2 rounded-lg bg-muted p-3 grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">En Pesos</p>
                    <p className="text-sm font-semibold">$ {formatNumber(downpaymentInARS)} ARS</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En Dólares</p>
                    <p className="text-sm font-semibold">$ {formatNumber(downpaymentInUSD)} USD</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: summary and simulator */}
        <div className="flex flex-col md:col-span-4 gap-4">
          {/* Coverage Summary */}
          <Card id="coverage-summary">
            <CardContent className="space-y-2">
              {propertyPriceUSD !== "" && downpaymentValue !== "" ? (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-base">Cobertura del anticipo</span>
                      <span className="font-semibold text-foreground">{coveragePercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${coveragePercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {coveragePercent >= 25 ? "Above 25% threshold" : "Below 25% threshold"}
                    </p>
                  </div>

                  {/* Remaining */}
                  <div className="grid gap-3 grid-cols-2">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Remaining to pay</p>
                      <p className="text-lg font-bold text-foreground">$ {formatNumber(remainingUSD)} USD</p>
                      <p className="text-xs text-muted-foreground">$ {formatNumber(remainingARS)} ARS</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Downpayment</p>
                      <p className="text-lg font-bold text-foreground">$ {formatNumber(downpaymentInUSD)} USD</p>
                      <p className="text-xs text-muted-foreground">$ {formatNumber(downpaymentInARS)} ARS</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Enter property price and downpayment to see coverage
                </p>
              )}
            </CardContent>
          </Card>

          {/* Simulador Crédito UVA (BNA) */}
          <Card id="mortgage-simulator">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Simulador Crédito UVA (BNA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {propertyPriceARS > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Valor vivienda (ARS)</Label>
                      <p className="text-lg font-semibold">$ {formatNumber(propertyPriceARS)} ARS</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mortgage-loan-amount">Monto a solicitar (ARS)</Label>
                      <Input
                        id="mortgage-loan-amount"
                        type="text"
                        inputMode="numeric"
                        placeholder={remainingARS > 0 ? formatNumber(remainingARS) : "0"}
                        value={mortgageLoanAmountDisplay}
                        onChange={handleMortgageLoanAmountChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Destino</Label>
                      <Select value={destino} onValueChange={(v: string) => setDestino(v as Destino)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DESTINO_LABELS) as Destino[]).map((d) => (
                            <SelectItem key={d} value={d}>
                              {DESTINO_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                      <Label>Plazo (años)</Label>
                      <Select
                        value={String(plazo)}
                        onValueChange={(v: string) => setPlazo(Number(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mortgageResult.plazoOptions.map((p) => (
                            <SelectItem key={p} value={String(p)}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Titular/es cobra/n haberes en BNA</Label>
                      <Select
                        value={cobraHaberesBNA}
                        onValueChange={(v: string) => setCobraHaberesBNA(v as "Si" | "No")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Si">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Adhiere opción tope CVS</Label>
                      <Select
                        value={adhiereOpcionTopeCVS}
                        onValueChange={(v: string) => setAdhiereOpcionTopeCVS(v as "Si" | "No")}
                        disabled={mortgageResult.topeCVSDisabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Si">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {Object.keys(mortgageResult.validation.errors).length > 0 && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive">Errores de validación</p>
                      <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                        {Object.entries(mortgageResult.validation.errors).map(([field, msg]) => (
                          <li key={field}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {canShowMortgage && mortgageResult.result && (
                    <>
                      <div className="grid gap-4 rounded-lg bg-muted p-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Detalles de préstamo</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            <li>Prop. de apoyo: {Math.round(mortgageResult.result.form.ProporcionApoyo)}%</li>
                            <li>Cuota en UVAs: {mortgageResult.result.primeraCuotaEnUva.toFixed(2)}</li>
                            <li>Valor propiedad en UVA: {mortgageResult.result.form.ValorPropiedadEnUva.toFixed(2)}</li>
                            <li>Monto inicial en UVA: {mortgageResult.result.form.MontoEnUva.toFixed(2)}</li>
                            <li>Ingresos netos necesarios titulares y codeudores: $ {formatNumber(mortgageResult.result.ingresosNecesarioTitularesYCod)}</li>
                            <li>Ingresos netos mínimos titulares: $ {formatNumber(mortgageResult.result.ingresosMinimosTitulares)}</li>
                          </ul>
                          <p className="mt-2 font-semibold">Cuota en $: $ {formatNumber(mortgageResult.result.primeraCuotaEnPesos)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tasas y costos financieros</p>
                          <ul className="mt-2 space-y-1 text-sm">
                            <li>UVA: {valorInicialUVA.toFixed(2)}</li>
                            <li>TNA: {mortgageResult.result.form.TNA.toFixed(2)}%</li>
                            <li>TEM: {mortgageResult.result.form.TEM.toFixed(2)}%</li>
                            <li>CFT TEM: {mortgageResult.result.plan.cft_tem.toFixed(2)}%</li>
                            <li>CFT TNA: {mortgageResult.result.plan.cft_tna.toFixed(2)}%</li>
                            <li>CFT TEA: {mortgageResult.result.plan.cft_tea.toFixed(2)}%</li>
                          </ul>
                        </div>
                      </div>

                      {/* {mortgageResult.diferenciaCobraHaberesBNA != null &&
                        mortgageResult.diferenciaCobraHaberesBNA !== 0 && (
                          <div className="rounded-lg border-2 border-foreground/20 bg-muted p-4 text-center">
                            <p className="font-bold">
                              {cobraHaberesBNA === "No"
                                ? `Si pasás tu sueldo al BNA, ¡ahorrás $ ${formatNumber(mortgageResult.diferenciaCobraHaberesBNA)} en tu cuota!`
                                : `Por cobrar tu sueldo en el BNA, ¡estás ahorrando $ ${formatNumber(mortgageResult.diferenciaCobraHaberesBNA)} en tu cuota!`}
                            </p>
                          </div>
                        )} */}

                      <Collapsible open={planDeCuotasOpen} onOpenChange={setPlanDeCuotasOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">
                            {planDeCuotasOpen ? "Ocultar" : "Ver"} plan de cuotas
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 overflow-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Cuota</TableHead>
                                  <TableHead>Saldo Capital UVA</TableHead>
                                  <TableHead>Capital UVA</TableHead>
                                  <TableHead>Interés UVA</TableHead>
                                  <TableHead>Prima UVA</TableHead>
                                  <TableHead>Cuota UVA</TableHead>
                                  <TableHead>Seguro</TableHead>
                                  <TableHead>Costo total UVA</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mortgageResult.result.plan.cuotas
                                  .filter((c) => c.numeroCuota > 0)
                                  .map((c) => (
                                    <TableRow key={c.numeroCuota}>
                                      <TableCell>{c.numeroCuota}</TableCell>
                                      <TableCell>{c.saldoCapitalEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.capitalCuotaEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.interesCuotaEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.primaCuotaEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.cuotaEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.seguroDeIncendioEnUva.toFixed(2)}</TableCell>
                                      <TableCell>{c.costoTotalClienteEnUva.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {propertyPriceARS > 0 && loanAmountARS <= 0 && (
                    <p className="text-sm text-muted-foreground">
                      Ingresá monto a solicitar o usá el restante a pagar (ingresá propiedad y anticipo arriba).
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Ingresá precio de propiedad para simular el crédito UVA
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
