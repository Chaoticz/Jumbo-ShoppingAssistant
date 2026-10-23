/**
 * Centrale domeintypen van de applicatie.
 *
 * Belangrijk: `id` is altijd de stabiele interne sleutel. Een Jumbo-code of
 * EAN mag wijzigen zonder dat recepten, winkelmandregels of voorraadkoppelingen
 * daardoor hun verwijzing verliezen.
 */
export type GroceryCategory = "Groente en fruit" | "Aardappelen, rijst en pasta" | "Vlees en vis" | "Zuivel, kaas en eieren" | "Brood en beleg" | "Dranken" | "Snacks" | "Huishouden" | "Overig"

export type MenuCategory = "AVG & stamppot" | "Pasta & gerechten" | "Kant-en-klaar" | "Dagelijkse boodschappen" | "Drinken" | "Snacks" | "Huishouden"

export type StorageType = "Gekoeld" | "Houdbaar" | "Diepvries" | "Vers"

export type Product = {
  /** Payload-document-ID voor updates en echte databaseverwijdering. */
  recordId: string
  /** Interne, onveranderlijke sleutel voor alle relaties in de app. */
  id: string
  name: string
  brand: string
  category: GroceryCategory
  menuCategory: MenuCategory
  /** Handmatig ingevoerde Jumbo-productcode; nooit als interne sleutel gebruiken. */
  code?: string
  /** Optionele EAN/barcode, los van de Jumbo-productcode. */
  ean?: string
  packageLabel: string
  packageSize: number
  unit: string
  price: number
  image: string
  /** Relatie-ID van het gekoppelde Payload-mediabestand. */
  imageRecordId?: string
  storage: StorageType
  preferred?: boolean
  enabled: boolean
  alternativeIds?: string[]
}

export type RecipeIngredient = {
  /** Eigen sleutel zodat ingrediënten binnen een recept verplaatst en bewerkt kunnen worden. */
  id: string
  name: string
  productId: string
  quantity: number
  unit: string
  alternativeProductIds?: string[]
}

export type Recipe = {
  /** Payload-document-ID voor updates en echte databaseverwijdering. */
  recordId: string
  id: string
  name: string
  category: MenuCategory
  description: string
  image: string
  imageRecordId?: string
  servings: number
  minutes: number
  ingredients: RecipeIngredient[]
  notes?: string
  enabled: boolean
}

export type MealCartItem = {
  id: string
  kind: "meal"
  recipeId: string
  servings: number
  skippedIngredientIds: string[]
  replacements: Record<string, string>
}

export type ProductCartItem = {
  id: string
  kind: "product"
  productId: string
  count: number
}

export type AvgCartItem = {
  id: string
  kind: "avg"
  name: string
  servings: number
  productIds: string[]
}

export type CartItem = MealCartItem | ProductCartItem | AvgCartItem

/** Samengevoegde productregel die uit één of meer winkelmanditems kan komen. */
export type MergedCartLine = {
  product: Product
  required: number
  unit: string
  packs: number
  sources: string[]
  estimatedPrice: number
}
