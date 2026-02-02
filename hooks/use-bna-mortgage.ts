"use client"

import { useMemo } from "react"
import {
  type Destino,
  type SiNoType,
  valorInicialUVA as defaultValorInicialUVA,
  computeMortgage,
  validateMortgage,
  getPlazoOptionsForDestino,
  isTopeCVSDisabled,
  SiNo,
  type ComputeMortgageResult,
} from "@/lib/bna-mortgage"

export interface UseBnaMortgageParams {
  valorInicialUVA?: number
  valorViviendaPesos: number
  montoPrestamoPesos: number
  plazo: number
  destino: Destino
  cobraHaberesBNA: SiNoType
  adhiereOpcionTopeCVS: SiNoType
  zonaPatagonica?: SiNoType
}

export interface UseBnaMortgageReturn {
  result: ComputeMortgageResult | null
  validation: { valid: boolean; errors: Record<string, string> }
  diferenciaCobraHaberesBNA: number | null
  plazoOptions: number[]
  topeCVSDisabled: boolean
}

/**
 * React hook for BNA UVA mortgage simulation.
 * Returns result, validation, diferencia (savings if toggling CobraHaberesBNA), plazoOptions, topeCVSDisabled.
 */
export function useBnaMortgage(
  params: UseBnaMortgageParams
): UseBnaMortgageReturn {
  const {
    valorInicialUVA = defaultValorInicialUVA,
    valorViviendaPesos,
    montoPrestamoPesos,
    plazo,
    destino,
    cobraHaberesBNA,
    adhiereOpcionTopeCVS,
    zonaPatagonica = SiNo.No,
  } = params

  const result = useMemo(() => {
    return computeMortgage({
      valorViviendaPesos,
      montoPrestamoPesos,
      plazo,
      destino,
      cobraHaberesBNA,
      adhiereOpcionTopeCVS,
      zonaPatagonica,
      valorInicialUVA,
    })
  }, [
    valorViviendaPesos,
    montoPrestamoPesos,
    plazo,
    destino,
    cobraHaberesBNA,
    adhiereOpcionTopeCVS,
    zonaPatagonica,
    valorInicialUVA,
  ])

  const validation = useMemo(() => {
    if (!result) return { valid: false, errors: {} as Record<string, string> }
    return validateMortgage(result.form, valorInicialUVA)
  }, [result, valorInicialUVA])

  const diferenciaCobraHaberesBNA = useMemo(() => {
    if (!result) return null
    const primeraCuotaPesos = result.primeraCuotaEnPesos
    const altCobraHaberes: SiNoType =
      cobraHaberesBNA === SiNo.Si ? SiNo.No : SiNo.Si
    const altResult = computeMortgage({
      valorViviendaPesos,
      montoPrestamoPesos,
      plazo,
      destino,
      cobraHaberesBNA: altCobraHaberes,
      adhiereOpcionTopeCVS,
      zonaPatagonica,
      valorInicialUVA,
    })
    if (!altResult) return null
    const altPrimeraCuotaPesos = altResult.primeraCuotaEnPesos
    if (cobraHaberesBNA === SiNo.No) {
      return primeraCuotaPesos - altPrimeraCuotaPesos
    }
    return altPrimeraCuotaPesos - primeraCuotaPesos
  }, [
    result,
    cobraHaberesBNA,
    adhiereOpcionTopeCVS,
    valorViviendaPesos,
    montoPrestamoPesos,
    plazo,
    destino,
    zonaPatagonica,
    valorInicialUVA,
  ])

  const plazoOptions = useMemo(
    () => getPlazoOptionsForDestino(destino),
    [destino]
  )

  const valorPropiedadEnUva = result?.form.ValorPropiedadEnUva ?? 0
  const topeCVSDisabled = useMemo(
    () => isTopeCVSDisabled(destino, valorPropiedadEnUva),
    [destino, valorPropiedadEnUva]
  )

  return {
    result: validation.valid ? result : null,
    validation,
    diferenciaCobraHaberesBNA: validation.valid ? diferenciaCobraHaberesBNA : null,
    plazoOptions,
    topeCVSDisabled,
  }
}
