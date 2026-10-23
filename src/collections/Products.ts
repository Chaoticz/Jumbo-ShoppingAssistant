import type { CollectionConfig } from "payload"
import { revalidateTag } from "next/cache"

const openHouseholdAccess = () => true

/**
 * Gedeelde productcatalogus.
 *
 * `internalId` blijft stabiel wanneer een EAN of Jumbo-code verandert. Recepten
 * verwijzen daarom nooit naar een winkelcode of productnaam.
 */
export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    group: "Thuisboodschappen",
    defaultColumns: ["name", "brand", "packageLabel", "enabled"],
  },
  access: {
    read: openHouseholdAccess,
    create: openHouseholdAccess,
    update: openHouseholdAccess,
    delete: openHouseholdAccess,
  },
  hooks: {
    afterChange: [
      () => {
        revalidateTag("grocery-products", "max")
        revalidateTag("grocery-recipes", "max")
      },
    ],
    afterDelete: [
      () => {
        revalidateTag("grocery-products", "max")
        revalidateTag("grocery-recipes", "max")
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const [recipeReferences, alternativeReferences] = await Promise.all([
          req.payload.find({
            collection: "recipes",
            where: {
              or: [
                { "ingredients.product": { equals: id } },
                { "ingredients.alternatives": { contains: id } },
              ],
            },
            limit: 1,
            overrideAccess: false,
            req,
          }),
          req.payload.find({
            collection: "products",
            where: { alternatives: { contains: id } },
            limit: 1,
            overrideAccess: false,
            req,
          }),
        ])

        if (recipeReferences.totalDocs || alternativeReferences.totalDocs) {
          throw new Error(
            "Dit product is nog gekoppeld aan een recept of alternatief. Pas die verwijzing eerst aan of deactiveer het product.",
          )
        }
      },
    ],
  },
  fields: [
    {
      name: "internalId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "Stabiele interne sleutel; wijzig deze niet voor een winkelcode.",
      },
    },
    { name: "name", type: "text", required: true },
    { name: "brand", type: "text", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        "Groente en fruit",
        "Aardappelen, rijst en pasta",
        "Vlees en vis",
        "Zuivel, kaas en eieren",
        "Brood en beleg",
        "Dranken",
        "Snacks",
        "Huishouden",
        "Overig",
      ],
    },
    {
      name: "menuCategory",
      type: "select",
      required: true,
      options: [
        "AVG & stamppot",
        "Pasta & gerechten",
        "Kant-en-klaar",
        "Dagelijkse boodschappen",
        "Drinken",
        "Snacks",
        "Huishouden",
      ],
    },
    {
      type: "row",
      fields: [
        { name: "jumboProductCode", type: "text" },
        {
          name: "ean",
          type: "text",
          admin: {
            description:
              "Wordt als tekst bewaard, zodat voorloopnullen behouden blijven.",
          },
        },
      ],
    },
    { name: "packageLabel", type: "text", required: true },
    {
      type: "row",
      fields: [
        { name: "packageSize", type: "number", required: true, min: 0.01 },
        { name: "unit", type: "text", required: true },
        { name: "price", type: "number", required: true, min: 0 },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "storage",
      type: "select",
      required: true,
      options: ["Gekoeld", "Houdbaar", "Diepvries", "Vers"],
    },
    { name: "preferred", type: "checkbox", defaultValue: false },
    { name: "enabled", type: "checkbox", defaultValue: true },
    {
      name: "alternatives",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
  ],
}
