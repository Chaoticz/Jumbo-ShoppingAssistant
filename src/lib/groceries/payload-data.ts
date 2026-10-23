import "server-only"

import config from "@payload-config"
import { unstable_cache } from "next/cache"
import { getPayload } from "payload"
import type {
  Media,
  Product as PayloadProduct,
  Recipe as PayloadRecipe,
} from "@/payload-types"
import type { Product, Recipe } from "./types"

const mediaData = (value: string | Media | null | undefined) => {
  if (!value || typeof value === "string") return { id: undefined, url: "" }
  return { id: value.id, url: value.url || "" }
}

/**
 * Leest de gedeelde catalogus uit Payload en zet relaties om naar het compacte
 * frontendmodel. De tags worden door zowel Server Actions als Admin-wijzigingen
 * ongeldig gemaakt.
 */
async function loadGroceryCatalog(): Promise<{
  products: Product[]
  recipes: Recipe[]
}> {
  const payload = await getPayload({ config })
  const [productResult, recipeResult] = await Promise.all([
    payload.find({
      collection: "products",
      limit: 100,
      depth: 1,
      sort: "name",
      overrideAccess: false,
    }),
    payload.find({
      collection: "recipes",
      limit: 100,
      depth: 2,
      sort: "name",
      overrideAccess: false,
    }),
  ])

  const payloadProducts = productResult.docs as PayloadProduct[]
  const internalIdByRecordId = new Map(
    payloadProducts.map((product) => [product.id, product.internalId]),
  )
  const toInternalId = (value: string | PayloadProduct) =>
    typeof value === "string"
      ? internalIdByRecordId.get(value)
      : value.internalId

  const products: Product[] = payloadProducts.map((product) => {
    const image = mediaData(product.image)
    return {
      recordId: product.id,
      id: product.internalId,
      name: product.name,
      brand: product.brand,
      category: product.category,
      menuCategory: product.menuCategory,
      code: product.jumboProductCode || undefined,
      ean: product.ean || undefined,
      packageLabel: product.packageLabel,
      packageSize: product.packageSize,
      unit: product.unit,
      price: product.price,
      image: image.url,
      imageRecordId: image.id,
      storage: product.storage,
      preferred: Boolean(product.preferred),
      enabled: product.enabled !== false,
      alternativeIds: (product.alternatives || [])
        .map(toInternalId)
        .filter((id): id is string => Boolean(id)),
    }
  })

  const recipes: Recipe[] = (recipeResult.docs as PayloadRecipe[]).flatMap(
    (recipe) => {
      const image = mediaData(recipe.image)
      const ingredients = recipe.ingredients.flatMap((ingredient) => {
        const productId = toInternalId(ingredient.product)
        if (!productId) return []
        return [
          {
            id: ingredient.ingredientId,
            name: ingredient.name,
            productId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            alternativeProductIds: (ingredient.alternatives || [])
              .map(toInternalId)
              .filter((id): id is string => Boolean(id)),
          },
        ]
      })
      if (!ingredients.length) return []
      return [
        {
          recordId: recipe.id,
          id: recipe.internalId,
          name: recipe.name,
          category: recipe.category,
          description: recipe.description,
          image: image.url,
          imageRecordId: image.id,
          servings: recipe.servings,
          minutes: recipe.minutes,
          ingredients,
          notes: recipe.notes || undefined,
          enabled: recipe.enabled !== false,
        },
      ]
    },
  )

  return { products, recipes }
}

export const getGroceryCatalog = unstable_cache(
  loadGroceryCatalog,
  ["grocery-catalog"],
  {
    tags: ["grocery-products", "grocery-recipes"],
    revalidate: false,
  },
)
