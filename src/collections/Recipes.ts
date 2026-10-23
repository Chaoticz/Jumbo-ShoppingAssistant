import type { CollectionConfig } from "payload"
import { revalidateTag } from "next/cache"

const openHouseholdAccess = () => true

/**
 * Receptdatabase met relationele productkoppelingen.
 *
 * Ingrediënten hebben een eigen stabiele sleutel en bewaren hoeveelheden los
 * van de verpakking van het gekoppelde winkelproduct.
 */
export const Recipes: CollectionConfig = {
  slug: "recipes",
  admin: {
    useAsTitle: "name",
    group: "Thuisboodschappen",
    defaultColumns: ["name", "category", "servings", "enabled"],
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
        revalidateTag("grocery-recipes", "max")
      },
    ],
    afterDelete: [
      () => {
        revalidateTag("grocery-recipes", "max")
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
    },
    { name: "name", type: "text", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: ["AVG & stamppot", "Pasta & gerechten"],
    },
    { name: "description", type: "textarea", required: true },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      type: "row",
      fields: [
        { name: "servings", type: "number", required: true, min: 1 },
        { name: "minutes", type: "number", required: true, min: 1 },
      ],
    },
    { name: "notes", type: "textarea" },
    { name: "enabled", type: "checkbox", defaultValue: true },
    {
      name: "ingredients",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "ingredientId",
          type: "text",
          required: true,
        },
        { name: "name", type: "text", required: true },
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          type: "row",
          fields: [
            { name: "quantity", type: "number", required: true, min: 0.01 },
            { name: "unit", type: "text", required: true },
          ],
        },
        {
          name: "alternatives",
          type: "relationship",
          relationTo: "products",
          hasMany: true,
        },
      ],
    },
  ],
}
