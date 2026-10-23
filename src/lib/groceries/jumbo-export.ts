import type { MergedCartLine } from "./types"

export type JumboExportRow = {
  identifier: string
  identifier_type: "EAN" | "JUMBO_PRODUCT_CODE"
  quantity: number
  product_id: string
  product_name: string
}

export type MissingIdentifier = {
  product_id: string
  product_name: string
  quantity: number
}

/**
 * Controleert gangbare EAN/GTIN-lengtes inclusief de controlecijferberekening.
 * De code blijft altijd tekst, zodat voorloopnullen niet verloren gaan.
 */
export function isValidEan(value?: string) {
  if (!value) return false
  const ean = value.trim()
  if (!/^\d{8}$|^\d{12,14}$/.test(ean)) return false
  const digits = [...ean].map(Number)
  const checkDigit = digits.pop()
  const sum = digits
    .reverse()
    .reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0,
    )
  return (10 - (sum % 10)) % 10 === checkDigit
}

/** Bouwt de Python-export onafhankelijk van de HTML of zichtbare kaartteksten. */
export function buildJumboExport(
  lines: MergedCartLine[],
): {
  rows: JumboExportRow[]
  missing: MissingIdentifier[]
} {
  const rows: JumboExportRow[] = []
  const missing: MissingIdentifier[] = []
  const seen = new Set<string>()

  lines.forEach((line) => {
    if (line.packs <= 0 || seen.has(line.product.id)) return
    seen.add(line.product.id)
    const ean = line.product.ean?.trim()
    const jumboCode = line.product.code?.trim()

    if (isValidEan(ean)) {
      rows.push({
        identifier: ean!,
        identifier_type: "EAN",
        quantity: line.packs,
        product_id: line.product.id,
        product_name: line.product.name,
      })
      return
    }
    if (jumboCode) {
      rows.push({
        identifier: jumboCode,
        identifier_type: "JUMBO_PRODUCT_CODE",
        quantity: line.packs,
        product_id: line.product.id,
        product_name: line.product.name,
      })
      return
    }
    missing.push({
      product_id: line.product.id,
      product_name: line.product.name,
      quantity: line.packs,
    })
  })

  return { rows, missing }
}

const csvValue = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`

/** UTF-8 CSV die direct met Python `csv.DictReader` kan worden gelezen. */
export function jumboRowsToCsv(rows: JumboExportRow[]) {
  const header = [
    "identifier",
    "identifier_type",
    "quantity",
    "product_id",
    "product_name",
  ]
  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.identifier,
        row.identifier_type,
        row.quantity,
        row.product_id,
        row.product_name,
      ]
        .map(csvValue)
        .join(","),
    ),
  ].join("\n")
}

/** Minimale code-export zonder lege regels of type-informatie. */
export function jumboRowsToTxt(rows: JumboExportRow[]) {
  return rows.map((row) => row.identifier).join("\n")
}
