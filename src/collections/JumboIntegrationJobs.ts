import type { CollectionConfig } from "payload"

const adminOnly = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

/**
 * Toekomstige wachtrij tussen de website en een lokale Python-agent.
 *
 * Een uniek `jobId` maakt opdrachten idempotent. Productgegevens worden als
 * snapshot bewaard, zodat cataloguswijzigingen een lopende opdracht niet
 * stilzwijgend veranderen. De collectie is niet publiek toegankelijk.
 */
export const JumboIntegrationJobs: CollectionConfig = {
  slug: "jumbo-integration-jobs",
  admin: {
    useAsTitle: "jobId",
    group: "Thuisboodschappen",
    defaultColumns: ["jobId", "status", "requestedAt", "completedAt"],
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "jobId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "Idempotentiesleutel: dezelfde opdracht mag maar één keer bestaan.",
      },
    },
    { name: "schemaVersion", type: "number", required: true, defaultValue: 1 },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "ready",
      options: [
        { label: "Klaar om te versturen", value: "ready" },
        { label: "Bezig met verwerken", value: "processing" },
        { label: "Producten toegevoegd", value: "completed" },
        { label: "Gedeeltelijk voltooid", value: "partial" },
        { label: "Mislukt", value: "failed" },
        { label: "Handmatige controle nodig", value: "manual_review" },
      ],
    },
    { name: "cartFingerprint", type: "text", required: true, index: true },
    { name: "requestedAt", type: "date", required: true },
    { name: "startedAt", type: "date" },
    { name: "completedAt", type: "date" },
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "itemId", type: "text", required: true },
        { name: "productId", type: "text", required: true },
        { name: "identifier", type: "text", required: true },
        {
          name: "identifierType",
          type: "select",
          required: true,
          options: [
            { label: "EAN", value: "EAN" },
            { label: "Jumbo-productcode", value: "JUMBO_PRODUCT_CODE" },
          ],
        },
        { name: "productName", type: "text", required: true },
        { name: "brand", type: "text", required: true },
        { name: "packageLabel", type: "text", required: true },
        { name: "variant", type: "text", required: true },
        { name: "requestedQuantity", type: "number", required: true, min: 1 },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "ready",
          options: [
            { label: "Klaar", value: "ready" },
            { label: "Bezig", value: "processing" },
            { label: "Product gevonden", value: "found" },
            { label: "Toegevoegd", value: "added" },
            { label: "Overgeslagen", value: "skipped" },
            { label: "Mislukt", value: "failed" },
            { label: "Handmatige controle", value: "manual_review" },
          ],
        },
        { name: "foundProductName", type: "text" },
        { name: "packagingMatches", type: "checkbox" },
        { name: "addedQuantity", type: "number", min: 0 },
        { name: "message", type: "textarea" },
      ],
    },
    {
      name: "missingIdentifiers",
      type: "array",
      fields: [
        { name: "productId", type: "text", required: true },
        { name: "productName", type: "text", required: true },
        { name: "quantity", type: "number", required: true, min: 1 },
        { name: "reason", type: "text", required: true },
      ],
    },
    {
      name: "summary",
      type: "group",
      fields: [
        { name: "total", type: "number", required: true, min: 0 },
        { name: "successful", type: "number", required: true, min: 0 },
        { name: "needsAttention", type: "number", required: true, min: 0 },
      ],
    },
    { name: "lastError", type: "textarea" },
  ],
}
