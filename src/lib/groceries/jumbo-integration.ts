import { buildJumboExport } from "./jumbo-export"
import type { MergedCartLine } from "./types"

export type IntegrationJobStatus = "ready" | "processing" | "completed" | "partial" | "failed" | "manual_review"

export type IntegrationItemStatus = "ready" | "processing" | "found" | "added" | "skipped" | "failed" | "manual_review"

export type JumboIntegrationItem = {
  item_id: string
  product_id: string
  identifier: string
  identifier_type: "EAN" | "JUMBO_PRODUCT_CODE"
  product_name: string
  brand: string
  package_label: string
  requested_quantity: number
  variant: string
  status: IntegrationItemStatus
  found_product_name?: string
  packaging_matches?: boolean
  added_quantity?: number
  message?: string
}

export type JumboIntegrationJob = {
  schema_version: 1
  job_id: string
  cart_fingerprint: string
  created_at: string
  status: IntegrationJobStatus
  items: JumboIntegrationItem[]
  missing_identifiers: {
    product_id: string
    product_name: string
    quantity: number
    reason: string
  }[]
  summary: {
    total: number
    successful: number
    needs_attention: number
  }
}

/**
 * Maakt een deterministische vingerafdruk van de daadwerkelijke verpakkingen.
 * De opdracht-ID blijft bij dubbelklikken gelijk zolang deze vingerafdruk gelijk is.
 */
export function createCartFingerprint(lines: MergedCartLine[]) {
  return lines
    .filter((line) => line.packs > 0)
    .map(
      (line) =>
        `${line.product.id}:${line.packs}:${line.product.ean || ""}:${line.product.code || ""}`,
    )
    .sort()
    .join("|")
}

/**
 * Bouwt het contract voor een toekomstige Python-agent vanuit domeindata.
 * Producten zonder code staan alleen in `missing_identifiers`.
 */
export function createJumboIntegrationJob(
  lines: MergedCartLine[],
  jobId: string,
  createdAt = new Date().toISOString(),
): JumboIntegrationJob {
  const exportData = buildJumboExport(lines)
  const lineByProductId = new Map(lines.map((line) => [line.product.id, line]))

  const missingIdentifiers = exportData.missing.map((item) => ({
    ...item,
    reason: "EAN en Jumbo-productcode ontbreken of de EAN is ongeldig.",
  }))

  return {
    schema_version: 1,
    job_id: jobId,
    cart_fingerprint: createCartFingerprint(lines),
    created_at: createdAt,
    status: "ready",
    items: exportData.rows.map((row) => {
      const line = lineByProductId.get(row.product_id)!
      return {
        item_id: `${jobId}:${row.product_id}`,
        product_id: row.product_id,
        identifier: row.identifier,
        identifier_type: row.identifier_type,
        product_name: row.product_name,
        brand: line.product.brand,
        package_label: line.product.packageLabel,
        requested_quantity: row.quantity,
        variant: `${line.product.brand} · ${line.product.packageLabel}`,
        status: "ready",
      }
    }),
    missing_identifiers: missingIdentifiers,
    summary: {
      total: exportData.rows.length + missingIdentifiers.length,
      successful: 0,
      needs_attention: missingIdentifiers.length,
    },
  }
}

export const integrationStatusLabels: Record<IntegrationJobStatus, string> = {
  ready: "Klaar om te versturen",
  processing: "Bezig met verwerken",
  completed: "Producten toegevoegd",
  partial: "Gedeeltelijk voltooid",
  failed: "Mislukt",
  manual_review: "Handmatige controle nodig",
}

export const integrationItemStatusLabels: Record<IntegrationItemStatus, string> =
  {
    ready: "Klaar",
    processing: "Bezig",
    found: "Product gevonden",
    added: "Toegevoegd",
    skipped: "Overgeslagen",
    failed: "Mislukt",
    manual_review: "Handmatige controle",
  }

/**
 * Expliciete adapter naar de Payload-veldnamen. Een toekomstige Server Action
 * kan deze functie gebruiken zonder UI-tekst of DOM-elementen uit te lezen.
 */
export function toPayloadIntegrationJobData(job: JumboIntegrationJob) {
  return {
    jobId: job.job_id,
    schemaVersion: job.schema_version,
    status: job.status,
    cartFingerprint: job.cart_fingerprint,
    requestedAt: job.created_at,
    items: job.items.map((item) => ({
      itemId: item.item_id,
      productId: item.product_id,
      identifier: item.identifier,
      identifierType: item.identifier_type,
      productName: item.product_name,
      brand: item.brand,
      packageLabel: item.package_label,
      variant: item.variant,
      requestedQuantity: item.requested_quantity,
      status: item.status,
      foundProductName: item.found_product_name,
      packagingMatches: item.packaging_matches,
      addedQuantity: item.added_quantity,
      message: item.message,
    })),
    missingIdentifiers: job.missing_identifiers.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      reason: item.reason,
    })),
    summary: {
      total: job.summary.total,
      successful: job.summary.successful,
      needsAttention: job.summary.needs_attention,
    },
  }
}
