import type { CartItem, MergedCartLine, Product, Recipe } from "./types"

export function mergeCart(
  cart: CartItem[],
  products: Product[],
  recipes: Recipe[],
): MergedCartLine[] {
  const merged = new Map<string, MergedCartLine>()
  const productById = new Map(products.map((item) => [item.id, item]))
  const add = (
    productId: string,
    required: number,
    unit: string,
    source: string,
  ) => {
    const product = productById.get(productId)
    if (!product) return
    const old = merged.get(productId)
    const total = (old?.required || 0) + required
    const packs = Math.max(
      1,
      Math.ceil(total / Math.max(product.packageSize, 1)),
    )
    merged.set(productId, {
      product,
      required: total,
      unit,
      packs,
      sources: old ? [...old.sources, source] : [source],
      estimatedPrice: packs * product.price,
    })
  }

  cart.forEach((item) => {
    if (item.kind === "product") {
      const product = productById.get(item.productId)
      if (product)
        add(
          product.id,
          product.packageSize * item.count,
          product.unit,
          "Los product",
        )
      return
    }
    if (item.kind === "avg") {
      item.productIds.forEach((id) => {
        const product = productById.get(id)
        if (product) add(id, product.packageSize, product.unit, item.name)
      })
      return
    }
    const recipe = recipes.find((entry) => entry.id === item.recipeId)
    if (!recipe) return
    recipe.ingredients.forEach((ingredient) => {
      if (item.skippedIngredientIds.includes(ingredient.id)) return
      const selectedProductId =
        item.replacements[ingredient.id] || ingredient.productId
      add(
        selectedProductId,
        ingredient.quantity * (item.servings / recipe.servings),
        ingredient.unit,
        recipe.name,
      )
    })
  })

  return [...merged.values()].sort(
    (a, b) =>
      a.product.category.localeCompare(b.product.category) ||
      a.product.name.localeCompare(b.product.name),
  )
}
