import type { CartItem, MergedCartLine, Product, Recipe } from "./types"

/**
 * Zet alle gekozen maaltijden, losse producten en AVG-combinaties om naar
 * samengevoegde productregels. De functie verandert de brondata niet.
 *
 * Receptingrediënten worden geschaald met het aantal eters. Daarna delen we de
 * totale behoefte door de verpakkingsgrootte en ronden we naar boven af. Deze
 * eenvoudige frontendberekening kan later vervangen worden door een slimme
 * backend die ook prijzen, restjes en voorraad meeweegt.
 */
export function mergeCart(
  cart: CartItem[],
  products: Product[],
  recipes: Recipe[],
): MergedCartLine[] {
  const merged = new Map<string, MergedCartLine>()
  const productById = new Map(products.map((item) => [item.id, item]))

  // Eén product-ID krijgt altijd één regel, ook als meerdere recepten het nodig hebben.
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
    // Er moet minstens één verpakking worden gekocht zodra er behoefte is.
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
    // Losse producten zijn al uitgedrukt in aantallen winkelverpakkingen.
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
    // Een samengestelde AVG bestaat uit gekozen winkelproducten.
    if (item.kind === "avg") {
      item.productIds.forEach((id) => {
        const product = productById.get(id)
        if (product) add(id, product.packageSize, product.unit, item.name)
      })
      return
    }
    // Bij een recept worden overgeslagen ingrediënten genegeerd en vervangingen gevolgd.
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
