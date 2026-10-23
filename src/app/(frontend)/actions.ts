"use server"

/** Vertaalt stabiele interne product-ID's naar Payload-relatie-ID's. */

/**
 * Maakt een product aan of werkt exact hetzelfde Payload-document bij.
 * Winkelcodes zijn gewone tekstvelden en hebben geen invloed op relaties.
 */

/** Verwijdert één echt productdocument; collection hooks bewaken de relaties. */

/** Valideert en bewaart een recept met echte Payload-productrelaties. */

/** Verwijdert het receptdocument definitief uit de gedeelde gegevensbron. */

import config from "@payload-config"
import { getPayload } from "payload"
import { revalidateTag } from "next/cache"
import type {
  GroceryCategory,
  MenuCategory,
  Product,
  Recipe,
  StorageType,
} from "@/lib/groceries/types"

type ActionResult = {
  ok: boolean
  recordId?: string
  error?: string
}

const groceryCategories: GroceryCategory[] = [
  "Groente en fruit",
  "Aardappelen, rijst en pasta",
  "Vlees en vis",
  "Zuivel, kaas en eieren",
  "Brood en beleg",
  "Dranken",
  "Snacks",
  "Huishouden",
  "Overig",
]
const menuCategories: MenuCategory[] = [
  "AVG & stamppot",
  "Pasta & gerechten",
  "Kant-en-klaar",
  "Dagelijkse boodschappen",
  "Drinken",
  "Snacks",
  "Huishouden",
]
const storageTypes: StorageType[] = ["Gekoeld", "Houdbaar", "Diepvries", "Vers"]

const cleanOptionalText = (value?: string) => {
  const clean = value?.trim()
  return clean ? clean : null
}
async function resolveProductRecordIds(internalIds: string[]) {
  if (!internalIds.length) return []
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: "products",
    where: { internalId: { in: internalIds } },
    limit: 100,
    depth: 0,
    overrideAccess: false,
  })
  return result.docs.map((product) => product.id)
}
export async function saveProductAction(
  product: Product,
): Promise<ActionResult> {
  try {
    if (
      !product.id.trim() ||
      !product.name.trim() ||
      !product.brand.trim() ||
      !product.packageLabel.trim() ||
      !product.unit.trim()
    ) {
      return { ok: false, error: "Vul alle verplichte productvelden in." }
    }
    if (
      !groceryCategories.includes(product.category) ||
      !menuCategories.includes(product.menuCategory) ||
      !storageTypes.includes(product.storage) ||
      product.packageSize <= 0 ||
      product.price < 0
    ) {
      return { ok: false, error: "Een productveld bevat een ongeldige waarde." }
    }

    const payload = await getPayload({ config })
    const alternatives = await resolveProductRecordIds(
      product.alternativeIds || [],
    )
    const data = {
      internalId: product.id,
      name: product.name.trim(),
      brand: product.brand.trim(),
      category: product.category,
      menuCategory: product.menuCategory,
      jumboProductCode: cleanOptionalText(product.code),
      ean: cleanOptionalText(product.ean),
      packageLabel: product.packageLabel.trim(),
      packageSize: product.packageSize,
      unit: product.unit.trim(),
      price: product.price,
      storage: product.storage,
      preferred: Boolean(product.preferred),
      enabled: product.enabled,
      alternatives,
      ...(product.imageRecordId ? { image: product.imageRecordId } : {}),
    }

    const saved = product.recordId
      ? await payload.update({
          collection: "products",
          id: product.recordId,
          data,
          overrideAccess: false,
        })
      : await payload.create({
          collection: "products",
          data,
          overrideAccess: false,
        })

    revalidateTag("grocery-products", "max")
    revalidateTag("grocery-recipes", "max")
    return { ok: true, recordId: saved.id }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Product opslaan is mislukt.",
    }
  }
}
export async function deleteProductAction(
  recordId: string,
): Promise<ActionResult> {
  try {
    if (!recordId) return { ok: false, error: "Product-ID ontbreekt." }
    const payload = await getPayload({ config })
    await payload.delete({
      collection: "products",
      id: recordId,
      overrideAccess: false,
    })
    revalidateTag("grocery-products", "max")
    revalidateTag("grocery-recipes", "max")
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Product verwijderen is mislukt.",
    }
  }
}
export async function saveRecipeAction(recipe: Recipe): Promise<ActionResult> {
  try {
    if (
      !recipe.id.trim() ||
      !recipe.name.trim() ||
      !recipe.description.trim() ||
      recipe.servings < 1 ||
      recipe.minutes < 1 ||
      !recipe.ingredients.length
    ) {
      return { ok: false, error: "Controleer de verplichte receptvelden." }
    }
    if (!["AVG & stamppot", "Pasta & gerechten"].includes(recipe.category)) {
      return { ok: false, error: "De receptcategorie is ongeldig." }
    }

    const allInternalIds = [
      ...new Set(
        recipe.ingredients.flatMap((ingredient) => [
          ingredient.productId,
          ...(ingredient.alternativeProductIds || []),
        ]),
      ),
    ]
    const payload = await getPayload({ config })
    const related = await payload.find({
      collection: "products",
      where: { internalId: { in: allInternalIds } },
      limit: 100,
      depth: 0,
      overrideAccess: false,
    })
    const recordIdByInternalId = new Map(
      related.docs.map((product) => [product.internalId, product.id]),
    )
    if (
      recipe.ingredients.some(
        (ingredient) => !recordIdByInternalId.has(ingredient.productId),
      )
    ) {
      return { ok: false, error: "Een gekoppeld product bestaat niet meer." }
    }

    const data = {
      internalId: recipe.id,
      name: recipe.name.trim(),
      category: recipe.category as "AVG & stamppot" | "Pasta & gerechten",
      description: recipe.description.trim(),
      servings: recipe.servings,
      minutes: recipe.minutes,
      notes: cleanOptionalText(recipe.notes),
      enabled: recipe.enabled,
      ...(recipe.imageRecordId ? { image: recipe.imageRecordId } : {}),
      ingredients: recipe.ingredients.map((ingredient) => ({
        ingredientId: ingredient.id,
        name: ingredient.name.trim(),
        product: recordIdByInternalId.get(ingredient.productId)!,
        quantity: ingredient.quantity,
        unit: ingredient.unit.trim(),
        alternatives: (ingredient.alternativeProductIds || [])
          .map((id) => recordIdByInternalId.get(id))
          .filter((id): id is string => Boolean(id)),
      })),
    }

    const saved = recipe.recordId
      ? await payload.update({
          collection: "recipes",
          id: recipe.recordId,
          data,
          overrideAccess: false,
        })
      : await payload.create({
          collection: "recipes",
          data,
          overrideAccess: false,
        })
    revalidateTag("grocery-recipes", "max")
    return { ok: true, recordId: saved.id }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Recept opslaan is mislukt.",
    }
  }
}
export async function deleteRecipeAction(
  recordId: string,
): Promise<ActionResult> {
  try {
    if (!recordId) return { ok: false, error: "Recept-ID ontbreekt." }
    const payload = await getPayload({ config })
    await payload.delete({
      collection: "recipes",
      id: recordId,
      overrideAccess: false,
    })
    revalidateTag("grocery-recipes", "max")
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Recept verwijderen is mislukt.",
    }
  }
}
