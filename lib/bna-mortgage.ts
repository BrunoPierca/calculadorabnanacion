/**
 * BNA UVA mortgage calculation logic (from Banco Nación simulator).
 * Pure module: constants + computeMortgage + validateMortgage.
 */

// --- Constants (from bank script) ---
export const valorInicialUVA = 1752.97
export const multiplicadorIngresosNecesariosTitularesYCod = 4
export const multiplicadorIngresosMinimosTitulares = 0.5
export const plazoMaximo = 30
export const plazoMaximoAmpliacion = 15
export const seguroDeIncendio = 0.0006
export const mesPrimeraCuota = 1
export const mesPrimeraCuotaAMP1 = 13
export const mesPrimeraCuotaCONST1 = 19
export const mesPrimeraCuotaCONST1ZonaPatagonica = 25
export const montoMinimoPrestamoEnUVAs = 15000
export const apoyoMaximo = 75
export const apoyoMaximoAmpliacion = 75
export const valorMaximoEnUVAsAdmiteTopeCVS = 210000
export const valorPropiedadDiferenciacionSegmento = 210000
export const tasaA = 6
export const tasaB = 12
export const valorPropiedadMaximoA = 350000
export const valorPropiedadMaximoB = 350000
export const montoMaximoA = 260000
export const montoMaximoB = 260000

export const DESTINOS = {
  ADQ1: "adq_unica",
  CONST1: "const_unica",
  AMP1: "amp_unica",
  ADQ2: "adq_segunda",
  AMP2: "amp_segunda",
  CONST2: "const_segunda",
} as const

export const DESTINOS_NO_TOPE_CVS = [
  DESTINOS.ADQ2,
  DESTINOS.AMP2,
  DESTINOS.CONST2,
] as const

export const DESTINOS_NO_TIR_PERIODO_GRACIA = [
  DESTINOS.CONST1,
  DESTINOS.CONST2,
  DESTINOS.AMP1,
  DESTINOS.AMP2,
] as const

export const SiNo = { Si: "Si", No: "No" } as const
export const SEGMENTOS = { A: "A", B: "B" } as const

export type Destino = (typeof DESTINOS)[keyof typeof DESTINOS]
export type SiNoType = (typeof SiNo)[keyof typeof SiNo]
export type Segmento = (typeof SEGMENTOS)[keyof typeof SEGMENTOS]

// --- Cuota row (plan de cuotas) ---
export interface Cuota {
  numeroCuota: number
  saldoCapitalEnUva: number
  capitalCuotaEnUva: number
  interesCuotaEnUva: number
  primaCuotaEnUva: number
  cuotaEnUva: number
  seguroDeIncendioEnUva: number
  ivaCuotaEnUva: number
  costoTotalClienteEnUva: number
}

// --- Form object (computed fields) ---
export interface BnaFormObject {
  Destino: Destino
  ValorVivienda: number
  Monto: number
  Plazo: number
  CobraHaberesBNA: SiNoType
  AdhiereOpcionTopeCVS: SiNoType
  ZonaPatagonica: SiNoType
  ValorInicialUVA: number
  ValorPropiedadEnUva: number
  MontoEnUva: number
  Segmento: Segmento
  MontoMaximoEnUVA: number
  ValorPropiedadMaximoEnUVA: number
  TNA: number
  TEM: number
  MontoAjustado: number
  MontoAjustadoEnUVA: number
  ProporcionApoyo: number
  TotalCuotas: number
  MesPrimeraCuota: number
}

// --- Compute params ---
export interface ComputeMortgageParams {
  valorViviendaPesos: number
  montoPrestamoPesos: number
  plazo: number
  destino: Destino
  cobraHaberesBNA: SiNoType
  adhiereOpcionTopeCVS: SiNoType
  zonaPatagonica?: SiNoType
  valorInicialUVA?: number
}

// --- Result ---
export interface ComputeMortgageResult {
  form: BnaFormObject
  plan: {
    cuotas: Cuota[]
    cft_tem: number
    cft_tna: number
    cft_tea: number
  }
  primeraCuotaEnUva: number
  primeraCuotaEnPesos: number
  ingresosNecesarioTitularesYCod: number
  ingresosMinimosTitulares: number
}

// --- Pure helpers ---
function calcularTNA(segmento: Segmento): number {
  return segmento === SEGMENTOS.A ? tasaA : tasaB
}

function calcularMontoMaximoEnUVA(segmento: Segmento): number {
  return segmento === SEGMENTOS.A ? montoMaximoA : montoMaximoB
}

function calcularValorPropiedadMaximoEnUVA(segmento: Segmento): number {
  return segmento === SEGMENTOS.A ? valorPropiedadMaximoA : valorPropiedadMaximoB
}

function calcularSegmento(
  destino: Destino,
  valorPropiedadEnUva: number,
  cobraHaberesBNA: SiNoType,
  _adhiereOpcionTopeCVS: SiNoType
): Segmento {
  if (
    cobraHaberesBNA === SiNo.Si &&
    (destino === DESTINOS.ADQ1 ||
      destino === DESTINOS.CONST1 ||
      destino === DESTINOS.AMP1) &&
    valorPropiedadEnUva <= valorPropiedadDiferenciacionSegmento
  ) {
    return SEGMENTOS.A
  }
  return SEGMENTOS.B
}

function calcularTEM(tna: number): number {
  return tna / 12
}

function calcularValorPropiedadUVA(valorVivienda: number, valorUVA: number): number {
  return valorVivienda / valorUVA
}

function convertirPesosAUvas(monto: number, valorUVA: number): number {
  return monto / valorUVA
}

function calcularProporcionApoyo(
  montoInicialUVA: number,
  valorPropiedadUVA: number
): number {
  return (montoInicialUVA / valorPropiedadUVA) * 100
}

function calcularSeguroDeIncendio(
  monto: number,
  destino: Destino,
  mesPrimeraCuotaVal: number,
  numeroCuota: number
): number {
  if (
    numeroCuota === 1 &&
    (destino === DESTINOS.AMP1 || destino === DESTINOS.AMP2)
  ) {
    return monto * seguroDeIncendio
  }
  if (
    numeroCuota >= mesPrimeraCuotaVal &&
    (numeroCuota - mesPrimeraCuotaVal) % 12 === 0
  ) {
    return monto * seguroDeIncendio
  }
  return 0
}

function calcularCantidadDeCuotas(plazo: number): number {
  return plazo * 12
}

function calcularAjusteMontoInicial(
  monto: number,
  destino: Destino,
  tem: number
): number {
  if (destino === DESTINOS.CONST1 || destino === DESTINOS.CONST2) {
    return (
      monto +
      monto * 0.3 * 6 * tem +
      monto * 0.8 * 6 * tem +
      monto * 6 * tem * 0
    )
  }
  return monto
}

function calcularCuota(
  capital: number,
  tem: number,
  totalCuotas: number
): number {
  return (capital * tem) / (1 - Math.pow(1 + tem, -totalCuotas))
}

function calcularMesPrimeraCuota(
  destino: Destino,
  zonaPatagonica: SiNoType
): number {
  if (destino === DESTINOS.AMP1 || destino === DESTINOS.AMP2)
    return mesPrimeraCuotaAMP1
  if (destino === DESTINOS.CONST1 || destino === DESTINOS.CONST2) {
    if (zonaPatagonica === SiNo.Si) return mesPrimeraCuotaCONST1ZonaPatagonica
    return mesPrimeraCuotaCONST1
  }
  return mesPrimeraCuota
}

function acumularIntereses(mesPrimeraCuotaVal: number, cuota: number): boolean {
  const dif = cuota - mesPrimeraCuotaVal
  if (dif >= 0 || dif < -6) return true
  return false
}

function calcularPrima(
  adhiereTopCVS: SiNoType,
  monto: number,
  cantidadCuotas: number
): number {
  const cuotaPlan45 = calcularCuota(monto, 0.06 / 12, cantidadCuotas)
  const cuotaPlan6 = calcularCuota(monto, 0.08 / 12, cantidadCuotas)
  const difCuotas = cuotaPlan6 - cuotaPlan45
  return adhiereTopCVS === SiNo.Si ? difCuotas : 0
}

function calcularIVA(
  destino: Destino,
  interes: number,
  prima: number
): number {
  return destino === DESTINOS.AMP2 ||
    destino === DESTINOS.ADQ2 ||
    destino === DESTINOS.CONST2
    ? interes * 0.21
    : prima * 0.21
}

function crearCuota(
  numeroCuota: number,
  nuevoSaldo: number,
  capital: number,
  interes: number,
  prima: number,
  cuota: number,
  seguroDeIncendioEnUva: number,
  ivaCuotaEnUva: number,
  costoTotalClienteEnUva: number
): Cuota {
  return {
    numeroCuota,
    saldoCapitalEnUva: nuevoSaldo,
    capitalCuotaEnUva: capital,
    interesCuotaEnUva: interes,
    primaCuotaEnUva: prima,
    cuotaEnUva: cuota,
    seguroDeIncendioEnUva,
    ivaCuotaEnUva,
    costoTotalClienteEnUva,
  }
}

function IRR(values: number[], guess?: number): number | undefined {
  const irrResult = (vals: number[], dates: number[], rate: number) => {
    let r = rate + 1
    let result = vals[0]
    for (let i = 1; i < vals.length; i++) {
      result += vals[i] / Math.pow(r, (dates[i] - dates[0]) / 365)
    }
    return result
  }
  const irrResultDeriv = (vals: number[], dates: number[], rate: number) => {
    let r = rate + 1
    let result = 0
    for (let i = 1; i < vals.length; i++) {
      const frac = (dates[i] - dates[0]) / 365
      result -= (frac * vals[i]) / Math.pow(r, frac + 1)
    }
    return result
  }

  const dates: number[] = []
  let positive = false
  let negative = false
  for (let i = 0; i < values.length; i++) {
    dates[i] = i === 0 ? 0 : dates[i - 1] + 365
    if (values[i] > 0) positive = true
    if (values[i] < 0) negative = true
  }
  if (!positive || !negative) return undefined

  let resultRate = typeof guess === "undefined" ? 0.1 : guess
  const epsMax = 1e-10
  const iterMax = 50
  let iteration = 0
  let contLoop = true

  do {
    const resultValue = irrResult(values, dates, resultRate)
    const newRate =
      resultRate -
      resultValue / irrResultDeriv(values, dates, resultRate)
    const epsRate = Math.abs(newRate - resultRate)
    resultRate = newRate
    contLoop = epsRate > epsMax && Math.abs(resultValue) > epsMax
  } while (contLoop && ++iteration < iterMax)

  if (contLoop) return undefined
  return resultRate
}

function calcularPlanDeCuotas(
  form: BnaFormObject,
  valorUVA: number
): ComputeMortgageResult["plan"] {
  const tem = form.TEM / 100
  let interesAcumuladoEnUva = 0
  const arrayCuotas: Cuota[] = []
  const arrayCostosTotales: number[] = []

  const montoInicialPlanDeCuotas =
    form.Destino === DESTINOS.CONST1 || form.Destino === DESTINOS.CONST2
      ? form.MontoEnUva * 0.3
      : form.MontoAjustadoEnUVA

  const montoCalculoCuota =
    form.Destino === DESTINOS.AMP1 || form.Destino === DESTINOS.AMP2
      ? form.MontoAjustadoEnUVA + form.MontoAjustadoEnUVA * tem * 6
      : form.MontoAjustadoEnUVA

  const cantidadDeCuotasReales =
    form.TotalCuotas - form.MesPrimeraCuota + 1

  arrayCuotas.push(
    crearCuota(
      0,
      montoInicialPlanDeCuotas,
      0,
      0,
      0,
      0,
      0,
      0,
      -montoInicialPlanDeCuotas
    )
  )

  if (!DESTINOS_NO_TIR_PERIODO_GRACIA.includes(form.Destino as any)) {
    arrayCostosTotales.push(-montoInicialPlanDeCuotas)
  }

  for (let cuotaActual = 1; cuotaActual <= form.TotalCuotas; cuotaActual++) {
    let saldo = arrayCuotas[cuotaActual - 1].saldoCapitalEnUva

    const seguroDeIncendioEnUva = calcularSeguroDeIncendio(
      form.ValorPropiedadEnUva,
      form.Destino,
      form.MesPrimeraCuota,
      cuotaActual
    )

    const acumular = acumularIntereses(form.MesPrimeraCuota, cuotaActual)
    if (acumular) interesAcumuladoEnUva += saldo * tem

    let ivaEnUva: number
    let cuotaTotalEnUva: number
    let capitalEnUva: number
    let costoTotalClienteEnUva: number
    let nuevoSaldo: number
    let interesEnUva: number
    let primaEnUva: number

    if (cuotaActual < form.MesPrimeraCuota) {
      ivaEnUva = 0
      cuotaTotalEnUva = 0
      capitalEnUva = 0
      nuevoSaldo = saldo
      primaEnUva = 0
      costoTotalClienteEnUva = seguroDeIncendioEnUva
      interesEnUva = 0
    } else {
      interesEnUva = saldo * tem
      if (
        (form.Destino === DESTINOS.ADQ1 ||
          form.Destino === DESTINOS.AMP1 ||
          form.Destino === DESTINOS.CONST1) &&
        cuotaActual < form.MesPrimeraCuota + 6
      ) {
        primaEnUva = 0
        ivaEnUva = 0
      } else {
        primaEnUva = calcularPrima(
          form.AdhiereOpcionTopeCVS,
          montoCalculoCuota,
          cantidadDeCuotasReales
        )
        ivaEnUva = calcularIVA(form.Destino, interesEnUva, primaEnUva)
      }
      cuotaTotalEnUva =
        calcularCuota(montoCalculoCuota, tem, cantidadDeCuotasReales) +
        primaEnUva +
        ivaEnUva
      capitalEnUva =
        cuotaTotalEnUva - interesEnUva - primaEnUva - ivaEnUva
      nuevoSaldo = saldo - capitalEnUva > 0 ? saldo - capitalEnUva : 0
      costoTotalClienteEnUva = cuotaTotalEnUva + seguroDeIncendioEnUva
    }

    switch (cuotaActual) {
      case 6:
        if (
          form.Destino === DESTINOS.CONST1 ||
          form.Destino === DESTINOS.CONST2
        ) {
          nuevoSaldo += form.MontoEnUva * 0.5
        }
        break
      case 12:
        if (
          form.Destino === DESTINOS.CONST1 ||
          form.Destino === DESTINOS.CONST2
        ) {
          nuevoSaldo += form.MontoEnUva * 0.2
        } else if (
          form.Destino === DESTINOS.AMP1 ||
          form.Destino === DESTINOS.AMP2
        ) {
          nuevoSaldo += interesAcumuladoEnUva
        }
        break
      case 18:
        if (
          form.Destino === DESTINOS.CONST1 ||
          form.Destino === DESTINOS.CONST2
        ) {
          nuevoSaldo += interesAcumuladoEnUva
        }
        break
      case 24:
        if (form.ZonaPatagonica === SiNo.Si) {
          nuevoSaldo += interesAcumuladoEnUva
        }
        break
    }

    arrayCuotas.push(
      crearCuota(
        cuotaActual,
        nuevoSaldo,
        capitalEnUva,
        interesEnUva,
        primaEnUva,
        cuotaTotalEnUva,
        seguroDeIncendioEnUva,
        ivaEnUva,
        costoTotalClienteEnUva
      )
    )

    if (DESTINOS_NO_TIR_PERIODO_GRACIA.includes(form.Destino as any)) {
      if (cuotaActual === form.MesPrimeraCuota - 1) {
        arrayCostosTotales.push(-nuevoSaldo)
        continue
      }
      if (cuotaActual >= form.MesPrimeraCuota) {
        arrayCostosTotales.push(costoTotalClienteEnUva)
        continue
      }
    } else {
      arrayCostosTotales.push(costoTotalClienteEnUva)
    }
  }

  const cft_temResult = IRR(arrayCostosTotales, tem)
  if (cft_temResult === undefined) {
    return {
      cuotas: arrayCuotas,
      cft_tem: 0,
      cft_tna: 0,
      cft_tea: 0,
    }
  }
  const cft_tem = cft_temResult
  const cft_tna = cft_tem * 12
  const cft_tea =
    Math.ceil((Math.pow(1 + cft_tem, 12) - 1) * 10000) / 10000
  return {
    cuotas: arrayCuotas,
    cft_tem: cft_tem * 100,
    cft_tna: cft_tna * 100,
    cft_tea: cft_tea * 100,
  }
}

function formatNumberForValidation(num: number, decimals: number): string {
  return parseFloat(num.toFixed(decimals)).toLocaleString("es-AR")
}

/**
 * Compute full mortgage: form fields + plan de cuotas + first cuota outputs.
 */
export function computeMortgage(
  params: ComputeMortgageParams
): ComputeMortgageResult | null {
  const valorUVA = params.valorInicialUVA ?? valorInicialUVA
  const zonaPatagonica = params.zonaPatagonica ?? SiNo.No

  const form: BnaFormObject = {
    Destino: params.destino,
    ValorVivienda: params.valorViviendaPesos,
    Monto: params.montoPrestamoPesos,
    Plazo: params.plazo,
    CobraHaberesBNA: params.cobraHaberesBNA,
    AdhiereOpcionTopeCVS: params.adhiereOpcionTopeCVS,
    ZonaPatagonica: zonaPatagonica,
    ValorInicialUVA: valorUVA,
    ValorPropiedadEnUva: calcularValorPropiedadUVA(
      params.valorViviendaPesos,
      valorUVA
    ),
    MontoEnUva: convertirPesosAUvas(params.montoPrestamoPesos, valorUVA),
    Segmento: "A",
    MontoMaximoEnUVA: 0,
    ValorPropiedadMaximoEnUVA: 0,
    TNA: 0,
    TEM: 0,
    MontoAjustado: 0,
    MontoAjustadoEnUVA: 0,
    ProporcionApoyo: 0,
    TotalCuotas: 0,
    MesPrimeraCuota: 0,
  }

  form.Segmento = calcularSegmento(
    form.Destino,
    form.ValorPropiedadEnUva,
    form.CobraHaberesBNA,
    form.AdhiereOpcionTopeCVS
  )
  form.MontoMaximoEnUVA = calcularMontoMaximoEnUVA(form.Segmento)
  form.ValorPropiedadMaximoEnUVA =
    calcularValorPropiedadMaximoEnUVA(form.Segmento)
  form.TNA = calcularTNA(form.Segmento)
  form.TEM = calcularTEM(form.TNA)
  form.MontoAjustado = calcularAjusteMontoInicial(
    Math.round(form.Monto),
    form.Destino,
    form.TEM / 100
  )
  form.MontoAjustadoEnUVA = convertirPesosAUvas(form.MontoAjustado, valorUVA)
  form.ProporcionApoyo = calcularProporcionApoyo(
    form.MontoEnUva,
    form.ValorPropiedadEnUva
  )
  form.TotalCuotas = calcularCantidadDeCuotas(form.Plazo)
  form.MesPrimeraCuota = calcularMesPrimeraCuota(
    form.Destino,
    zonaPatagonica
  )

  const plan = calcularPlanDeCuotas(form, valorUVA)

  let primeraCuotaIndex = form.MesPrimeraCuota
  if (
    form.Destino === DESTINOS.ADQ1 ||
    form.Destino === DESTINOS.AMP1 ||
    form.Destino === DESTINOS.CONST1
  ) {
    primeraCuotaIndex = form.MesPrimeraCuota + 6
  }

  const primeraCuotaEnUva = plan.cuotas[primeraCuotaIndex]?.cuotaEnUva ?? 0
  const primeraCuotaEnPesos = primeraCuotaEnUva * valorUVA
  const ingresosNecesarioTitularesYCod =
    primeraCuotaEnUva *
    multiplicadorIngresosNecesariosTitularesYCod *
    valorUVA
  const ingresosMinimosTitulares =
    ingresosNecesarioTitularesYCod * multiplicadorIngresosMinimosTitulares

  return {
    form,
    plan,
    primeraCuotaEnUva,
    primeraCuotaEnPesos,
    ingresosNecesarioTitularesYCod,
    ingresosMinimosTitulares,
  }
}

export interface ValidateMortgageResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate form against BNA rules. Pass the form from computeMortgage result.
 */
export function validateMortgage(
  form: BnaFormObject,
  valorUVA: number = valorInicialUVA
): ValidateMortgageResult {
  const errors: Record<string, string> = {}

  if (form.MontoEnUva > form.MontoMaximoEnUVA) {
    errors.Monto = `Monto máximo ${formatNumberForValidation(form.MontoMaximoEnUVA, 0)} UVAs ($${formatNumberForValidation(form.MontoMaximoEnUVA * valorUVA, 0)}) para este destino`
  }
  if (form.MontoEnUva < montoMinimoPrestamoEnUVAs) {
    errors.Monto = `Monto mínimo ${formatNumberForValidation(montoMinimoPrestamoEnUVAs, 0)} UVAs ($${formatNumberForValidation(montoMinimoPrestamoEnUVAs * valorUVA, 0)})`
  }
  if (form.MontoEnUva > form.ValorVivienda) {
    errors.Monto = "El monto no puede superar el valor de la vivienda"
  }
  if (form.ValorPropiedadEnUva > form.ValorPropiedadMaximoEnUVA) {
    errors.ValorVivienda = `El valor no puede superar ${formatNumberForValidation(form.ValorPropiedadMaximoEnUVA, 0)} UVAs`
  }
  if (
    (form.Destino === DESTINOS.AMP1 || form.Destino === DESTINOS.AMP2) &&
    form.Plazo > 15
  ) {
    errors.Plazo = "El plazo máximo para este destino es de 15 años"
  }
  if (
    form.Destino === DESTINOS.ADQ2 &&
    form.AdhiereOpcionTopeCVS === SiNo.Si
  ) {
    errors.AdhiereOpcionTopeCVS = "No se puede adherir para este destino"
  }
  if (
    form.AdhiereOpcionTopeCVS === SiNo.Si &&
    form.CobraHaberesBNA === SiNo.No
  ) {
    errors.AdhiereOpcionTopeCVS =
      "Solo pueden adherir quienes cobran haberes BNA"
  }
  if (
    (form.Destino === DESTINOS.AMP1 || form.Destino === DESTINOS.AMP2) &&
    form.ProporcionApoyo > apoyoMaximoAmpliacion
  ) {
    errors.Monto = `Se supera el apoyo máximo de ${apoyoMaximoAmpliacion}%`
  }
  if (form.ProporcionApoyo > apoyoMaximo) {
    errors.Monto = `Se supera el apoyo máximo de ${apoyoMaximo}%`
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Plazo options (years) for a destino: 5–30 or 5–15 for ampliación.
 */
export function getPlazoOptionsForDestino(destino: Destino): number[] {
  const max =
    destino === DESTINOS.AMP1 || destino === DESTINOS.AMP2
      ? plazoMaximoAmpliacion
      : plazoMaximo
  const options: number[] = []
  for (let p = 5; p <= max; p += 5) options.push(p)
  return options
}

/**
 * Whether tope CVS option should be disabled (ADQ2/AMP2/CONST2 or valor > 210k UVA).
 */
export function isTopeCVSDisabled(
  destino: Destino,
  valorPropiedadEnUva: number
): boolean {
  if (DESTINOS_NO_TOPE_CVS.includes(destino as any)) return true
  return valorPropiedadEnUva > valorMaximoEnUVAsAdmiteTopeCVS
}
