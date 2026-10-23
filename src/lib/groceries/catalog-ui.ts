import type { MenuCategory } from "./types"

type MenuCategoryItem = {
  name: MenuCategory
  description: string
}

/** Alleen presentatieconfiguratie; product- en receptrecords komen uit Payload. */
export const menuCategories: MenuCategoryItem[] = [
  { name: "AVG & stamppot", description: "Klassiek of zelf samenstellen" },
  { name: "Pasta & gerechten", description: "Favoriete gezinsmaaltijden" },
  { name: "Kant-en-klaar", description: "Pizza, lasagne en meer" },
  { name: "Dagelijkse boodschappen", description: "Brood, melk en beleg" },
  { name: "Drinken", description: "Fris, thee en sap" },
  { name: "Snacks", description: "Iets lekkers voor erbij" },
  { name: "Huishouden", description: "Voorraad voor in huis" },
]

/** Stabiele interne product-ID's bepalen de drie stappen van de AVG-wizard. */
export const avgSteps = [
  {
    title: "Kies je aardappelen",
    ids: [
      "aardappel-kruimig",
      "aardappel-vast",
      "krieltjes",
      "aardappelschijfjes",
      "friet",
    ],
  },
  {
    title: "Kies je vlees",
    ids: ["hamburgers", "worst", "schnitzel", "vegaburger"],
  },
  {
    title: "Kies je groente",
    ids: ["sperziebonen", "broccoli", "bloemkool", "doperwten"],
  },
]
