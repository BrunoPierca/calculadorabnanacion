"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PropertyConverter() {
  const [exchangeRate, setExchangeRate] = useState(1500)
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState("1.500")
  const [propertyPriceUSD, setPropertyPriceUSD] = useState<number | "">("")
  const [propertyPriceDisplay, setPropertyPriceDisplay] = useState("")
  const [downpaymentValue, setDownpaymentValue] = useState<number | "">("")
  const [downpaymentDisplay, setDownpaymentDisplay] = useState("")
  const [downpaymentCurrency, setDownpaymentCurrency] = useState<"ARS" | "USD">("ARS")

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

  const progressBarColor = coveragePercent >= 25 ? "bg-green-500" : "bg-red-500"

  return (
    <main className="min-h-dvh bg-background p-4 md:p-6 overflow-auto">
      <div className="mx-auto grid h-full max-w-4xl gap-4 md:grid-cols-2 md:grid-rows-[auto_1fr_1fr]">
        <header className="md:col-span-2">
          <h1 className="text-2xl font-bold text-foreground">Property Price Converter</h1>
          <p className="text-sm text-muted-foreground">USD to Argentine Pesos conversion for property purchases</p>
        </header>

        {/* Exchange Rate */}
        <Card id="exchange-rate" className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Exchange Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">1 USD =</span>
              <Input
                type="text"
                inputMode="numeric"
                value={exchangeRateDisplay}
                onChange={handleExchangeRateChange}
                className="w-32"
              />
              <span className="text-muted-foreground">ARS</span>
            </div>
          </CardContent>
        </Card>

        {/* Property Price */}
        <Card id="property-price">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Property Price</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="property-price-input">Price in USD</Label>
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
                <p className="text-xs text-muted-foreground">Equivalent in Pesos</p>
                <p className="text-xl font-bold text-foreground">
                  $ {formatNumber(propertyPriceARS)} ARS
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Downpayment */}
        <Card id="downpayment">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Downpayment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="downpayment-input">Amount</Label>
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
                <Select value={downpaymentCurrency} onValueChange={(v) => setDownpaymentCurrency(v as "ARS" | "USD")}>
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
                  <p className="text-xs text-muted-foreground">In Pesos</p>
                  <p className="text-sm font-semibold">$ {formatNumber(downpaymentInARS)} ARS</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">In Dollars</p>
                  <p className="text-sm font-semibold">$ {formatNumber(downpaymentInUSD)} USD</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coverage Summary */}
        <Card id="coverage-summary" className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coverage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {propertyPriceUSD !== "" && downpaymentValue !== "" ? (
              <>
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Downpayment covers</span>
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
      </div>
    </main>
  )
}
