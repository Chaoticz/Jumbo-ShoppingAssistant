import AppClient from "./components/AppClient"
import { getGroceryCatalog } from "@/lib/groceries/payload-data"

/** De server levert op iedere geldige cacheversie dezelfde gedeelde catalogus aan elk apparaat. */
export default async function HomePage() {
  const catalog = await getGroceryCatalog()
  return (
    <AppClient
      initialProducts={catalog.products}
      initialRecipes={catalog.recipes}
    />
  )
}
