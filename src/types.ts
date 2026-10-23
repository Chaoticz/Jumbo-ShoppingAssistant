export type GroceryCategory = "Groente en fruit" | "Aardappelen, rijst en pasta" | "Vlees en vis" | "Zuivel, kaas en eieren" | "Brood en beleg" | "Dranken" | "Snacks" | "Huishouden" | "Overig"

export type MenuCategory = "AVG & stamppot" | "Pasta & gerechten" | "Kant-en-klaar" | "Dagelijkse boodschappen" | "Drinken" | "Snacks" | "Huishouden"

export type StorageType = "Gekoeld" | "Houdbaar" | "Diepvries" | "Vers"

export type Product = {
  id: string
  name: string
  brand: string
  category: GroceryCategory
  menuCategory: MenuCategory
  code?: string
  packageLabel: string
  packageSize: number
  unit: string
  price: number
  image: string
  storage: StorageType
  preferred?: boolean
  enabled: boolean
  alternativeIds?: string[]
}

export type RecipeIngredient = {
  id: string
  name: string
  productId: string
  quantity: number
  unit: string
  alternativeProductIds?: string[]
}

export type Recipe = {
  id: string
  name: string
  category: MenuCategory
  description: string
  image: string
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

export type MergedCartLine = {
  product: Product
  required: number
  unit: string
  packs: number
  sources: string[]
  estimatedPrice: number
}
