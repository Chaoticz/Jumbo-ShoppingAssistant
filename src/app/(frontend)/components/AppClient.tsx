"use client"

/** Kleine ingebouwde iconenset zodat acties overal visueel hetzelfde zijn. */

/**
 * Leest een waarde uit localStorage. Bij ontbrekende of beschadigde JSON wordt
 * veilig de meegegeven standaardwaarde gebruikt, zodat de app kan blijven starten.
 */

/** Formatteert bedragen overal op dezelfde Nederlandse manier. */

/**
 * Hoofdcomponent: beheert navigatie, gedeelde catalogus en de actieve lokale winkelmand.
 * Onderliggende pagina's ontvangen alleen de gegevens en acties die zij nodig hebben.
 */
// Producten en recepten komen uit de gedeelde Payload-database.
// Per product-ID bewaren we een handmatig gekozen aantal verpakkingen.
// De waarde 0 betekent: alleen uit de actieve lijst verbergen.

/** Vaste bovenbalk met snelle toegang tot het actieve lijstje. */

/** Hoofdnavigatie voor tablet-liggend en desktop. */

/** Compacte navigatie voor smalle schermen en telefoons. */

/** Gedeelde titelopbouw voor consistente pagina-hiërarchie. */

/** Samenvatting van de actieve gezinsbestelling. */

/**
 * Visuele bestelzuil. Filters worden afgeleid van de centrale product- en
 * receptcatalogus; kaarten zijn daardoor niet los in de interface vastgelegd.
 */
// Een eerder uit de lijst verborgen ingrediënt wordt bij een nieuwe keuze weer zichtbaar.

/** Visuele receptkaart; een tweede tik opent de bestaande keuze om te bewerken. */

/** Productkaart voor losse boodschappen met een groot tabletvriendelijk aanraakdoel. */

/** Zijmand met de gekozen bronitems voordat ze naar productregels worden samengevoegd. */

/** Bewerkt alleen een geplande maaltijd, niet het onderliggende recept. */

/** Vierstapswizard die de tussenkeuzes bewaart wanneer de gebruiker teruggaat. */

/**
 * Toont de definitieve, samengevoegde boodschappenlijst.
 *
 * `lines` bevat al eventuele handmatige verpakkingsaantallen. Een aanpassing
 * schrijft alleen naar `lineOverrides`; recepten en productrecords blijven
 * daardoor onaangetast.
 */

/** Downloadt UTF-8 tekst zonder gegevens uit de visuele DOM te lezen. */

/** Exporteert precies de zichtbare, handmatig aangepaste lijst naar CSV. */

/** Past uitsluitend het te kopen aantal verpakkingen van deze bestelling aan. */

/** Klein formulier voor een handmatig aantal winkelverpakkingen. */

/** Overzicht van producten die lokaal als aanwezig zijn gemarkeerd. */

/** Lokale bezorgsamenvatting; er vindt bewust geen automatische Jumbo-overdracht plaats. */

/**
 * Gedeelde beheeromgeving voor producten en recepten.
 *
 * Toevoegen en bewerken gebruiken hetzelfde formulier. Bij bewerken blijft de
 * interne `id` behouden, zodat alle bestaande verwijzingen geldig blijven.
 */

/** Valideert en bewaart een product zonder bij bewerken een nieuw record te maken. */

/** Slaat alle ingrediëntregels in hun huidige volgorde op onder dezelfde recept-ID. */

/** Herbruikbare bevestiging voor destructieve acties. */

/** Gedeelde formulierkaart voor zowel toevoegen als bewerken. */
/** Label en invoerveld worden samen gegroepeerd voor leesbaarheid en toegankelijkheid. */
/** Grote plus/minbediening voor aantallen en personen. */
/** Scrollbare dialoog die ook binnen een staande tabletviewport past. */
/** Onderste schuiflade voor de winkelmand op smallere tablets en telefoons. */
/** Herbruikbare lege toestand met optionele vervolgstap. */

/**
 * Bereidt één stabiele opdracht voor de huidige lijst voor. Nogmaals klikken
 * met exact dezelfde lijst hergebruikt hetzelfde ID en voorkomt dubbel werk.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { mergeCart } from "@/lib/groceries/cart"
import { avgSteps, menuCategories } from "@/lib/groceries/catalog-ui"
import {
  deleteProductAction,
  deleteRecipeAction,
  saveProductAction,
  saveRecipeAction,
} from "../actions"
import {
  buildJumboExport,
  jumboRowsToCsv,
  jumboRowsToTxt,
} from "@/lib/groceries/jumbo-export"
import {
  createCartFingerprint,
  createJumboIntegrationJob,
  integrationItemStatusLabels,
  integrationStatusLabels,
  type JumboIntegrationJob,
} from "@/lib/groceries/jumbo-integration"
import type {
  AvgCartItem,
  CartItem,
  MealCartItem,
  MenuCategory,
  MergedCartLine,
  Product,
  Recipe,
  RecipeIngredient,
  GroceryCategory,
  StorageType,
} from "@/lib/groceries/types"

const NAV = [
  "Overzicht",
  "Boodschappen",
  "Boodschappenlijstje",
  "Voorraad",
  "Bestellingen",
  "Beheer",
]
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80"
const CATEGORY_ICONS: Record<MenuCategory, IconName> = {
  "AVG & stamppot": "plate",
  "Pasta & gerechten": "fork",
  "Kant-en-klaar": "clock",
  "Dagelijkse boodschappen": "bag",
  Drinken: "glass",
  Snacks: "spark",
  Huishouden: "home",
}

type IconName = "home" | "shop" | "list" | "box" | "history" | "settings" | "cart" | "people" | "search" | "chevron" | "check" | "plus" | "minus" | "trash" | "plate" | "fork" | "clock" | "bag" | "glass" | "spark" | "close" | "edit" | "arrow"
const NAV_ICONS: Record<string, IconName> = {
  Overzicht: "home",
  Boodschappen: "shop",
  Boodschappenlijstje: "list",
  Voorraad: "box",
  Bestellingen: "history",
  Beheer: "settings",
}
type NavigationProps = {
  page: string
  go: (page: string) => void
}

type StatProps = {
  value: string | number
  label: string
}

type InfoCardProps = {
  title: string
  text: string
}
function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5M9 20v-6h6v6" />
      </>
    ),
    shop: (
      <>
        <path d="M4 9h16l-1.2 11H5.2L4 9Z" />
        <path d="M8 9a4 4 0 0 1 8 0" />
      </>
    ),
    list: (
      <>
        <path d="m4 7 2 2 4-4M12 7h8M4 15l2 2 4-4M12 15h8" />
      </>
    ),
    box: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2h10.9L21 7H6" />
        <circle cx="9" cy="19" r="1.4" />
        <circle cx="18" cy="19" r="1.4" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 4.9V20" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      </>
    ),
    plate: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
      </>
    ),
    fork: (
      <>
        <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c4 2 4 8 0 10" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l-1 13H6L5 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
    glass: (
      <>
        <path d="M6 3h12l-2 8a4 4 0 0 1-8 0L6 3ZM12 15v6M8 21h8" />
      </>
    ),
    spark: (
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    edit: (
      <>
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.5 7 3.5 3.5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
function load<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}
const money = (value: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    value,
  )
export default function AppClient({
  initialProducts,
  initialRecipes,
}: {
  initialProducts: Product[]
  initialRecipes: Recipe[]
}) {
  const [page, setPage] = useState("Overzicht")
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [cart, setCart] = useState<CartItem[]>(() =>
    load("tb-order-cart-v1", []),
  )
  const [notice, setNotice] = useState("")
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    load("tb-checked-v3", {}),
  )
  const [stock, setStock] = useState<Record<string, number>>(() =>
    load("tb-stock-v3", {}),
  )
  const [lineOverrides, setLineOverrides] = useState<Record<string, number>>(
    () => load("tb-list-overrides-v1", {}),
  )

  useEffect(
    () => localStorage.setItem("tb-order-cart-v1", JSON.stringify(cart)),
    [cart],
  )
  useEffect(
    () => localStorage.setItem("tb-checked-v3", JSON.stringify(checked)),
    [checked],
  )
  useEffect(
    () => localStorage.setItem("tb-stock-v3", JSON.stringify(stock)),
    [stock],
  )
  useEffect(
    () =>
      localStorage.setItem(
        "tb-list-overrides-v1",
        JSON.stringify(lineOverrides),
      ),
    [lineOverrides],
  )

  const lines = useMemo(() => {
    const calculated = mergeCart(cart, products, recipes)
    return calculated
      .filter((line) => lineOverrides[line.product.id] !== 0)
      .map((line) => {
        const overriddenPacks = lineOverrides[line.product.id]
        if (overriddenPacks === undefined) return line
        return {
          ...line,
          packs: overriddenPacks,
          estimatedPrice: overriddenPacks * line.product.price,
        }
      })
  }, [cart, products, recipes, lineOverrides])
  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2200)
  }
  const go = (next: string) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {notice && (
        <div className="fixed right-5 top-5 z-[80] rounded-2xl bg-ink-deep px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}
      <Header go={go} itemCount={cart.length} />
      <div className="mx-auto flex max-w-[1480px]">
        <Sidebar page={page} go={go} />
        <main
          className={`min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 ${
            page === "Boodschappen" ? "xl:px-6" : "max-w-[1200px]"
          }`}
        >
          {page === "Overzicht" && (
            <Dashboard cart={cart} lines={lines} go={go} />
          )}
          {page === "Boodschappen" && (
            <Shop
              products={products}
              recipes={recipes}
              cart={cart}
              setCart={setCart}
              setLineOverrides={setLineOverrides}
              lines={lines}
              go={go}
              flash={flash}
            />
          )}
          {page === "Boodschappenlijstje" && (
            <ShoppingList
              lines={lines}
              checked={checked}
              setChecked={setChecked}
              stock={stock}
              setStock={setStock}
              lineOverrides={lineOverrides}
              setLineOverrides={setLineOverrides}
              clearCart={() => {
                setCart([])
                setLineOverrides({})
                setChecked({})
              }}
              go={go}
              flash={flash}
            />
          )}
          {page === "Voorraad" && (
            <Inventory products={products} stock={stock} setStock={setStock} />
          )}
          {page === "Bestellingen" && <Orders lines={lines} />}
          {page === "Beheer" && (
            <Admin
              products={products}
              setProducts={setProducts}
              recipes={recipes}
              setRecipes={setRecipes}
              cart={cart}
              setCart={setCart}
              stock={stock}
              flash={flash}
            />
          )}
        </main>
      </div>
      <MobileNav page={page} go={go} />
    </div>
  )
}
function Header({
  go,
  itemCount,
}: {
  go: (page: string) => void
  itemCount: number
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={() => go("Overzicht")}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-jumbo text-ink-deep">
            <Icon name="home" />
          </span>
          <span>
            <strong className="block text-lg leading-tight">
              Thuisboodschappen
            </strong>
            <small className="text-muted">Samen kiezen, slim bestellen</small>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("Boodschappenlijstje")}
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-white"
          >
            <Icon name="cart" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-jumbo px-1 text-[10px] font-black">
                {itemCount}
              </span>
            )}
          </button>
          <span className="hidden rounded-full bg-[#f3f3ee] px-3 py-2 text-xs font-bold text-muted sm:block">
            Catalogus gedeeld via Payload
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-deep text-sm font-bold text-white">
            TB
          </span>
        </div>
      </div>
    </header>
  )
}
function Sidebar({ page, go }: NavigationProps) {
  return (
    <aside className="hidden w-60 shrink-0 px-5 py-7 md:block">
      <nav className="sticky top-28 space-y-1">
        {NAV.map((item) => (
          <button
            key={item}
            onClick={() => go(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
              page === item
                ? "bg-jumbo text-ink-deep shadow-sm"
                : "text-muted hover:bg-white hover:text-ink"
            }`}
          >
            <Icon name={NAV_ICONS[item]} size={19} />
            {item}
          </button>
        ))}
        <div className="mt-8 rounded-2xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-jumbo" />
            Handmatige overdracht
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Geen live Jumbo-koppeling. Controleer en kopieer straks je
            samengevoegde lijst.
          </p>
        </div>
      </nav>
    </aside>
  )
}
function MobileNav({ page, go }: NavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around overflow-x-auto border-t border-line bg-white px-1 py-2 md:hidden">
      {NAV.slice(0, 5).map((item) => (
        <button
          key={item}
          onClick={() => go(item)}
          className={`min-w-[64px] rounded-xl px-2 py-1.5 text-[10px] font-bold ${
            page === item ? "bg-jumbo" : "text-muted"
          }`}
        >
          <Icon name={NAV_ICONS[item]} size={18} className="mx-auto mb-1" />
          {item === "Boodschappenlijstje" ? "Lijstje" : item}
        </button>
      ))}
    </nav>
  )
}
function PageTitle({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: string
  sub: string
}) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#8a6d00]">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-muted">{sub}</p>
    </div>
  )
}
function Dashboard({
  cart,
  lines,
  go,
}: {
  cart: CartItem[]
  lines: MergedCartLine[]
  go: (page: string) => void
}) {
  const meals = cart.filter((item) => item.kind !== "product").length
  return (
    <section>
      <PageTitle
        eyebrow="Goedemorgen"
        title="Rust in je boodschappen."
        sub="Plan samen jullie maaltijden, controleer wat er nodig is en zet één heldere bestelling klaar."
      />
      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-[28px] bg-ink-deep p-7 text-white shadow-sm sm:p-9">
          <p className="text-sm font-bold text-white/60">
            Volgende gezinsbestelling
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight">
            Bouw samen in een paar klikken jullie menu voor de komende dagen.
          </h2>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat value={meals} label="maaltijden" />
            <Stat value={lines.length} label="producten" />
            <Stat
              value={money(
                lines.reduce((sum, line) => sum + line.estimatedPrice, 0),
              )}
              label="indicatie"
            />
          </div>
          <button
            onClick={() => go("Boodschappen")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-jumbo px-5 py-3 font-black text-ink-deep"
          >
            Start met kiezen <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-jumbo-soft">
            <Icon name="cart" />
          </span>
          <h3 className="mt-5 text-xl font-black">Jullie mandje wacht</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Alles wat je kiest wordt direct samengevoegd. Gedeelde ingrediënten
            blijven netjes staan als je een andere maaltijd verwijdert.
          </p>
          <button
            onClick={() => go("Boodschappenlijstje")}
            className="mt-5 text-sm font-black underline decoration-jumbo decoration-4 underline-offset-4"
          >
            Bekijk boodschappenlijstje
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <InfoCard
          title="Samen kiezen"
          text="Grote visuele kaarten, gemaakt voor een gezin voor één scherm."
        />
        <InfoCard
          title="Personen per maaltijd"
          text="Pas per gerecht aan wie er die dag mee-eet."
        />
        <InfoCard
          title="Klaar voor slimme keuzes"
          text="Ruimte voor verpakkingsadvies, voorraad en alternatieven."
        />
      </div>
    </section>
  )
}
function Shop({
  products,
  recipes,
  cart,
  setCart,
  setLineOverrides,
  lines,
  go,
  flash,
}: {
  products: Product[]
  recipes: Recipe[]
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  setLineOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>
  lines: MergedCartLine[]
  go: (page: string) => void
  flash: (message: string) => void
}) {
  const [category, setCategory] = useState<MenuCategory>("Pasta & gerechten")
  const [servings, setServings] = useState(4)
  const [query, setQuery] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<string | null>(null)
  const mealItems = cart.filter(
    (item): item is MealCartItem => item.kind === "meal",
  )
  const activeRecipes = recipes.filter(
    (recipe) =>
      recipe.enabled &&
      recipe.category === category &&
      recipe.name.toLowerCase().includes(query.toLowerCase()),
  )
  const activeProducts = products.filter(
    (product) =>
      product.enabled &&
      product.menuCategory === category &&
      category !== "AVG & stamppot" &&
      category !== "Pasta & gerechten" &&
      product.name.toLowerCase().includes(query.toLowerCase()),
  )
  const addRecipe = (recipe: Recipe) => {
    const existing = mealItems.find((item) => item.recipeId === recipe.id)
    if (existing) {
      setEditingMeal(existing.id)
      return
    }
    const item: MealCartItem = {
      id: `meal-${Date.now()}`,
      kind: "meal",
      recipeId: recipe.id,
      servings,
      skippedIngredientIds: [],
      replacements: {},
    }
    setCart((current) => [...current, item])
    setLineOverrides((current) => {
      const next = { ...current }
      recipe.ingredients.forEach(
        (ingredient) => delete next[ingredient.productId],
      )
      return next
    })
    flash(`${recipe.name} toegevoegd voor ${servings} personen`)
  }
  const addProduct = (product: Product) => {
    setLineOverrides((current) => {
      const next = { ...current }
      delete next[product.id]
      return next
    })
    setCart((current) => {
      const existing = current.find(
        (item) => item.kind === "product" && item.productId === product.id,
      )
      if (existing?.kind === "product")
        return current.map((item) =>
          item.id === existing.id
            ? { ...existing, count: existing.count + 1 }
            : item,
        )
      return [
        ...current,
        {
          id: `product-${product.id}-${Date.now()}`,
          kind: "product",
          productId: product.id,
          count: 1,
        },
      ]
    })
  }

  return (
    <section>
      <div className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-6 overflow-hidden rounded-[28px] bg-ink-deep text-white">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-jumbo">
                  Gezinsmenu
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Waar hebben jullie zin in?
                </h1>
                <p className="mt-2 max-w-2xl text-white/65">
                  Klik, voeg toe en winkel verder. Wij houden de gezamenlijke
                  bestelling bij.
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="mb-2 text-xs font-bold text-white/60">
                  Voor hoeveel personen koken we?
                </p>
                <Counter
                  value={servings}
                  onMinus={() => setServings(Math.max(1, servings - 1))}
                  onPlus={() => setServings(Math.min(10, servings + 1))}
                  dark
                  label="personen"
                />
              </div>
            </div>
          </div>
          <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
            {menuCategories.map((item) => (
              <button
                key={item.name}
                onClick={() => setCategory(item.name)}
                className={`group min-w-[150px] rounded-2xl border p-4 text-left transition ${
                  category === item.name
                    ? "border-jumbo bg-jumbo shadow-sm"
                    : "border-line bg-white hover:-translate-y-0.5 hover:border-[#cacac2]"
                }`}
              >
                <span
                  className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${
                    category === item.name ? "bg-white/70" : "bg-[#f3f3ee]"
                  }`}
                >
                  <Icon name={CATEGORY_ICONS[item.name]} size={21} />
                </span>
                <strong className="block text-sm leading-tight">
                  {item.name}
                </strong>
                <small
                  className={`mt-1 block leading-tight ${
                    category === item.name ? "text-ink/65" : "text-muted"
                  }`}
                >
                  {item.description}
                </small>
              </button>
            ))}
          </div>
          <div className="mb-5 flex items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Zoek in deze categorie"
                className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm outline-none"
              />
            </div>
            <span className="hidden text-sm font-bold text-muted sm:block">
              {activeRecipes.length + activeProducts.length} keuzes
            </span>
          </div>
          {category === "AVG & stamppot" && (
            <div className="mb-6 rounded-[24px] border-2 border-jumbo bg-jumbo-soft p-5 sm:flex sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#775e00]">
                  Zelf samenstellen
                </span>
                <h2 className="mt-1 text-xl font-black">
                  Maak jullie eigen AVG-maaltijd
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Kies aardappelen, vlees of vega en groente in vier
                  overzichtelijke stappen.
                </p>
              </div>
              <button
                onClick={() => setWizardOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink-deep px-5 py-3 text-sm font-black text-white sm:mt-0"
              >
                Start de wizard <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
          {activeRecipes.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  selected={mealItems.some(
                    (item) => item.recipeId === recipe.id,
                  )}
                  onAdd={() => addRecipe(recipe)}
                />
              ))}
            </div>
          )}
          {activeProducts.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map((product) => {
                const count = cart.find(
                  (item) =>
                    item.kind === "product" && item.productId === product.id,
                )
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    count={count?.kind === "product" ? count.count : 0}
                    onAdd={() => {
                      addProduct(product)
                      flash(`${product.name} toegevoegd`)
                    }}
                  />
                )
              })}
            </div>
          )}
          {!activeRecipes.length &&
            !activeProducts.length &&
            category !== "AVG & stamppot" && (
              <Empty
                title="Geen resultaten"
                text="Probeer een andere zoekterm of voeg zelf iets toe in Beheer."
              />
            )}
        </div>
        <aside className="hidden min-[1100px]:block">
          <div className="sticky top-24">
            <CartPanel
              cart={cart}
              setCart={setCart}
              products={products}
              recipes={recipes}
              lines={lines}
              onEditMeal={setEditingMeal}
              go={go}
            />
          </div>
        </aside>
      </div>
      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-[78px] left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-ink-deep px-5 py-4 text-white shadow-2xl md:bottom-5 min-[1100px]:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-jumbo text-ink">
            <Icon name="cart" />
          </span>
          <span className="text-left">
            <strong className="block text-sm">Bekijk bestelling</strong>
            <small className="text-white/60">
              {cart.length} keuzes · {lines.length} producten
            </small>
          </span>
        </span>
        <strong>
          {money(lines.reduce((sum, line) => sum + line.estimatedPrice, 0))}
        </strong>
      </button>
      {cartOpen && (
        <Drawer close={() => setCartOpen(false)}>
          <CartPanel
            cart={cart}
            setCart={setCart}
            products={products}
            recipes={recipes}
            lines={lines}
            onEditMeal={(id) => {
              setEditingMeal(id)
              setCartOpen(false)
            }}
            go={go}
          />
        </Drawer>
      )}
      {wizardOpen && (
        <AvgWizard
          products={products}
          servings={servings}
          close={() => setWizardOpen(false)}
          onAdd={(item) => {
            setCart((current) => [...current, item])
            setLineOverrides((current) => {
              const next = { ...current }
              item.productIds.forEach((id) => delete next[id])
              return next
            })
            setWizardOpen(false)
            flash("Jullie AVG-maaltijd staat in het mandje")
          }}
        />
      )}
      {editingMeal && (
        <MealEditor
          item={mealItems.find((item) => item.id === editingMeal)}
          recipes={recipes}
          products={products}
          close={() => setEditingMeal(null)}
          update={(next) =>
            setCart((current) =>
              current.map((item) => (item.id === next.id ? next : item)),
            )
          }
        />
      )}
    </section>
  )
}
function RecipeCard({
  recipe,
  selected,
  onAdd,
}: {
  recipe: Recipe
  selected: boolean
  onAdd: () => void
}) {
  return (
    <article
      className={`group overflow-hidden rounded-[24px] border bg-white transition hover:-translate-y-1 hover:shadow-lg ${
        selected ? "border-jumbo ring-2 ring-jumbo" : "border-line"
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          width={900}
          height={600}
          src={recipe.image || FALLBACK_IMAGE}
          alt={recipe.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black shadow-sm">
          {recipe.minutes} min
        </span>
        {selected && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-jumbo px-3 py-1.5 text-xs font-black">
            <Icon name="check" size={14} /> Gekozen
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-black">{recipe.name}</h3>
        <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted">
          {recipe.description}
        </p>
        <button
          onClick={onAdd}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black ${
            selected ? "border border-line bg-white" : "bg-jumbo"
          }`}
        >
          {selected ? (
            <>
              <Icon name="edit" size={17} /> Bekijk keuze
            </>
          ) : (
            <>
              <Icon name="plus" size={17} /> Toevoegen
            </>
          )}
        </button>
      </div>
    </article>
  )
}
function ProductCard({
  product,
  count,
  onAdd,
}: {
  product: Product
  count: number
  onAdd: () => void
}) {
  return (
    <article
      className={`group overflow-hidden rounded-[24px] border bg-white transition hover:-translate-y-1 hover:shadow-lg ${
        count ? "border-jumbo ring-2 ring-jumbo" : "border-line"
      }`}
    >
      <div className="relative h-44 overflow-hidden bg-[#f1f1eb]">
        <Image
          width={900}
          height={600}
          src={product.image || FALLBACK_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {count > 0 && (
          <span className="absolute right-3 top-3 grid h-9 min-w-9 place-items-center rounded-full bg-jumbo px-2 text-sm font-black">
            {count}×
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold">
          {product.storage}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold text-muted">
          {product.brand} · {product.packageLabel}
        </p>
        <h3 className="mt-1 text-lg font-black">{product.name}</h3>
        <div className="mt-4 flex items-center justify-between">
          <strong className="text-lg">{money(product.price)}</strong>
          <button
            onClick={onAdd}
            aria-label={`${product.name} toevoegen`}
            className="grid h-11 w-11 place-items-center rounded-xl bg-jumbo"
          >
            <Icon name="plus" />
          </button>
        </div>
      </div>
    </article>
  )
}
function CartPanel({
  cart,
  setCart,
  products,
  recipes,
  lines,
  onEditMeal,
  go,
}: {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  products: Product[]
  recipes: Recipe[]
  lines: MergedCartLine[]
  onEditMeal: (id: string) => void
  go: (page: string) => void
}) {
  const total = lines.reduce((sum, line) => sum + line.estimatedPrice, 0)
  const remove = (id: string) =>
    setCart((current) => current.filter((item) => item.id !== id))
  return (
    <div className="overflow-hidden rounded-[26px] border border-line bg-white shadow-sm">
      <div className="bg-ink-deep p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-jumbo">
              Jullie bestelling
            </p>
            <h2 className="mt-1 text-2xl font-black">Winkelmand</h2>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-jumbo text-ink">
            <Icon name="cart" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <strong className="block text-xl">
              {cart.filter((item) => item.kind !== "product").length}
            </strong>
            <small className="text-white/60">maaltijden</small>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <strong className="block text-xl">{lines.length}</strong>
            <small className="text-white/60">unieke producten</small>
          </div>
        </div>
      </div>
      <div className="max-h-[44vh] space-y-2 overflow-auto p-4">
        {cart.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f3f3ee]">
              <Icon name="cart" />
            </span>
            <p className="mt-3 text-sm font-bold">Nog niets gekozen</p>
            <p className="mt-1 text-xs text-muted">
              Klik op een maaltijd of product.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const title =
              item.kind === "meal"
                ? recipes.find((entry) => entry.id === item.recipeId)?.name
                : item.kind === "product"
                  ? products.find((entry) => entry.id === item.productId)?.name
                  : item.name
            const sub =
              item.kind === "meal" || item.kind === "avg"
                ? `${item.servings} personen`
                : `${item.count} verpakking${item.count === 1 ? "" : "en"}`
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-[#f6f6f2] p-3"
              >
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{title}</strong>
                  <small className="text-muted">{sub}</small>
                </div>
                {item.kind === "meal" && (
                  <button
                    onClick={() => onEditMeal(item.id)}
                    aria-label="Maaltijd aanpassen"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-white"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                )}
                {item.kind === "product" && (
                  <button
                    onClick={() =>
                      setCart((current) =>
                        current.map((entry) =>
                          entry.id === item.id && entry.kind === "product"
                            ? { ...entry, count: entry.count + 1 }
                            : entry,
                        ),
                      )
                    }
                    aria-label="Aantal verhogen"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-jumbo"
                  >
                    <Icon name="plus" size={15} />
                  </button>
                )}
                <button
                  onClick={() => remove(item.id)}
                  aria-label="Verwijderen"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#8e3025]"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            )
          })
        )}
      </div>
      <div className="border-t border-line p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Prijsindicatie</span>
          <strong className="text-xl">{money(total)}</strong>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Gebaseerd op lokale voorbeeldprijzen, niet op actuele Jumbo-prijzen.
        </p>
        <button
          disabled={!cart.length}
          onClick={() => go("Boodschappenlijstje")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-jumbo py-3.5 text-sm font-black disabled:opacity-40"
        >
          Naar boodschappenlijstje <Icon name="arrow" size={17} />
        </button>
      </div>
    </div>
  )
}
function MealEditor({
  item,
  recipes,
  products,
  close,
  update,
}: {
  item?: MealCartItem
  recipes: Recipe[]
  products: Product[]
  close: () => void
  update: (item: MealCartItem) => void
}) {
  if (!item) return null
  const recipe = recipes.find((entry) => entry.id === item.recipeId)
  if (!recipe) return null
  const alternatives = (ingredientProductId: string) =>
    products
      .filter(
        (product) =>
          product.id === ingredientProductId ||
          product.category ===
            products.find((entry) => entry.id === ingredientProductId)
              ?.category,
      )
      .slice(0, 5)
  return (
    <Modal title={recipe.name} close={close} wide>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Image
          width={900}
          height={600}
          src={recipe.image || FALLBACK_IMAGE}
          alt={recipe.name}
          className="h-48 w-full rounded-2xl object-cover lg:h-full"
        />
        <div>
          <div className="flex items-center justify-between rounded-2xl bg-jumbo-soft p-4">
            <div>
              <strong className="block">Aantal personen</strong>
              <small className="text-muted">
                Alle benodigde hoeveelheden rekenen mee.
              </small>
            </div>
            <Counter
              value={item.servings}
              onMinus={() =>
                update({ ...item, servings: Math.max(1, item.servings - 1) })
              }
              onPlus={() =>
                update({ ...item, servings: Math.min(10, item.servings + 1) })
              }
            />
          </div>
          <h3 className="mb-3 mt-6 font-black">Ingrediënten</h3>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient) => {
              const skipped = item.skippedIngredientIds.includes(ingredient.id)
              return (
                <div
                  key={ingredient.id}
                  className={`rounded-xl border p-3 ${
                    skipped
                      ? "border-line bg-[#f3f3ee] opacity-60"
                      : "border-line bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() =>
                        update({
                          ...item,
                          skippedIngredientIds: skipped
                            ? item.skippedIngredientIds.filter(
                                (id) => id !== ingredient.id,
                              )
                            : [...item.skippedIngredientIds, ingredient.id],
                        })
                      }
                      className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
                        skipped
                          ? "border-ink bg-ink text-white"
                          : "border-[#c7c7bf]"
                      }`}
                    >
                      {skipped && <Icon name="close" size={14} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <strong className="text-sm">{ingredient.name}</strong>
                      <p className="text-xs text-muted">
                        {Math.round(
                          ((ingredient.quantity * item.servings) /
                            recipe.servings) *
                            10,
                        ) / 10}{" "}
                        {ingredient.unit} nodig
                      </p>
                      <select
                        value={
                          item.replacements[ingredient.id] ||
                          ingredient.productId
                        }
                        onChange={(event) =>
                          update({
                            ...item,
                            replacements: {
                              ...item.replacements,
                              [ingredient.id]: event.target.value,
                            },
                          })
                        }
                        className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs"
                      >
                        {alternatives(ingredient.productId).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.brand} {product.name} ·{" "}
                            {product.packageLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 rounded-xl border border-[#ebd56e] bg-[#fff9dc] p-4 text-sm">
            <strong>Voorbeeld van toekomstig slim advies</strong>
            <p className="mt-1 text-muted">
              Je kookt voor {item.servings} personen. Straks vergelijken we
              kleinere verpakkingen, prijs en bruikbare restjes voordat je een
              alternatief bevestigt.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
function AvgWizard({
  products,
  servings,
  close,
  onAdd,
}: {
  products: Product[]
  servings: number
  close: () => void
  onAdd: (item: AvgCartItem) => void
}) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const current = avgSteps[step]
  const chosenProducts = Object.values(selected)
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean) as Product[]
  const canContinue = step === 3 || Boolean(selected[step])
  return (
    <Modal title="Stel jullie AVG-maaltijd samen" close={close} wide>
      <div className="mb-6 flex items-center gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${
                index <= step ? "bg-jumbo" : "bg-[#ededE7] text-muted"
              }`}
            >
              {index < step ? <Icon name="check" size={15} /> : index + 1}
            </span>
            {index < 3 && (
              <span
                className={`h-1 flex-1 rounded-full ${
                  index < step ? "bg-jumbo" : "bg-[#ededE7]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {step < 3 ? (
        <>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-wider text-[#826700]">
              Stap {step + 1} van 4
            </p>
            <h3 className="mt-1 text-2xl font-black">{current.title}</h3>
            <p className="mt-1 text-sm text-muted">
              Kies één optie. Je selectie blijft bewaard wanneer je teruggaat.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.ids.map((id) => {
              const product = products.find((entry) => entry.id === id)
              if (!product) return null
              const active = selected[step] === id
              return (
                <button
                  key={id}
                  onClick={() =>
                    setSelected((value) => ({ ...value, [step]: id }))
                  }
                  className={`overflow-hidden rounded-2xl border-2 bg-white text-left ${
                    active
                      ? "border-jumbo ring-2 ring-jumbo-soft"
                      : "border-line"
                  }`}
                >
                  <div className="relative h-28">
                    <Image
                      width={900}
                      height={600}
                      src={product.image || FALLBACK_IMAGE}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {active && (
                      <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-jumbo">
                        <Icon name="check" size={17} />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <strong className="block text-sm">{product.name}</strong>
                    <small className="text-muted">
                      {product.packageLabel} · {money(product.price)}
                    </small>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#826700]">
            Stap 4 van 4
          </p>
          <h3 className="mt-1 text-2xl font-black">
            Controleer jullie maaltijd
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {chosenProducts.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <Image
                  width={900}
                  height={600}
                  src={product.image || FALLBACK_IMAGE}
                  alt=""
                  className="h-28 w-full object-cover"
                />
                <div className="p-3">
                  <strong className="block text-sm">{product.name}</strong>
                  <small className="text-muted">{product.packageLabel}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#ead15a] bg-jumbo-soft p-5">
            <span className="rounded-full bg-jumbo px-2.5 py-1 text-xs font-black">
              Aanbevolen
            </span>
            <h4 className="mt-3 font-black">
              Praktische verpakkingen voor {servings} personen
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Dit prototype toont per gekozen product één verpakking. Later
              vergelijken we kleinere verpakkingen, diepvriesopties, prijs per
              kilo en bruikbare restjes. Jij bevestigt altijd zelf het
              alternatief.
            </p>
          </div>
        </div>
      )}
      <div className="mt-7 flex justify-between border-t border-line pt-5">
        <button
          onClick={() => (step === 0 ? close() : setStep(step - 1))}
          className="rounded-xl border border-line px-5 py-3 text-sm font-black"
        >
          {step === 0 ? "Annuleren" : "Terug"}
        </button>
        <button
          disabled={!canContinue}
          onClick={() =>
            step < 3
              ? setStep(step + 1)
              : onAdd({
                  id: `avg-${Date.now()}`,
                  kind: "avg",
                  name: "Zelf samengestelde AVG",
                  servings,
                  productIds: chosenProducts.map((product) => product.id),
                })
          }
          className="flex items-center gap-2 rounded-xl bg-jumbo px-5 py-3 text-sm font-black disabled:opacity-40"
        >
          {step < 3 ? "Volgende" : "Toevoegen aan bestelling"}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </Modal>
  )
}
function ShoppingList({
  lines,
  checked,
  setChecked,
  stock,
  setStock,
  lineOverrides,
  setLineOverrides,
  clearCart,
  go,
  flash,
}: {
  lines: MergedCartLine[]
  checked: Record<string, boolean>
  setChecked: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  stock: Record<string, number>
  setStock: React.Dispatch<React.SetStateAction<Record<string, number>>>
  lineOverrides: Record<string, number>
  setLineOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>
  clearCart: () => void
  go: (page: string) => void
  flash: (message: string) => void
}) {
  const [editingLine, setEditingLine] = useState<MergedCartLine | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [integrationOpen, setIntegrationOpen] = useState(false)
  const [integrationJob, setIntegrationJob] =
    useState<JumboIntegrationJob | null>(null)
  const integrationJobRef = useRef<JumboIntegrationJob | null>(null)
  const categories = [...new Set(lines.map((line) => line.product.category))]
  const pythonExport = useMemo(() => buildJumboExport(lines), [lines])
  const openIntegration = () => {
    const fingerprint = createCartFingerprint(lines)
    const current = integrationJobRef.current
    const next =
      current?.cart_fingerprint === fingerprint
        ? current
        : createJumboIntegrationJob(
            lines,
            `jumbo-${window.crypto.randomUUID()}`,
          )
    integrationJobRef.current = next
    setIntegrationJob(next)
    setIntegrationOpen(true)
  }
  const downloadText = (filename: string, content: string, type: string) => {
    const link = document.createElement("a")
    link.href = URL.createObjectURL(
      new Blob(["\uFEFF", content], { type: `${type};charset=utf-8` }),
    )
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const exportCsv = () => {
    const rows = [
      "Categorie,Product,Merk,Verpakkingen,Verpakking,Prijs",
      ...lines.map((line) =>
        [
          line.product.category,
          line.product.name,
          line.product.brand,
          line.packs,
          line.product.packageLabel,
          line.estimatedPrice,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ]
    const link = document.createElement("a")
    link.href = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
    )
    link.download = "boodschappenlijst.csv"
    link.click()
    URL.revokeObjectURL(link.href)
    flash("CSV-bestand gedownload")
  }

  const copy = async () => {
    await navigator.clipboard.writeText(
      lines
        .map(
          (line) => `${line.packs}× ${line.product.brand} ${line.product.name}`,
        )
        .join("\n"),
    )
    flash("Boodschappenlijst gekopieerd")
  }
  const setPacks = (line: MergedCartLine, packs: number) =>
    setLineOverrides((current) => ({
      ...current,
      [line.product.id]: Math.max(0, packs),
    }))

  return (
    <section>
      <PageTitle
        eyebrow="Centrale winkelmand"
        title="Boodschappenlijstje"
        sub={`${lines.length} unieke producten, samengevoegd vanuit alle gekozen maaltijden en losse boodschappen.`}
      />
      <div className="mb-5 rounded-2xl border border-[#ead15a] bg-jumbo-soft p-4 text-sm">
        <strong>Handmatige Jumbo-overdracht.</strong> De berekende behoefte
        blijft zichtbaar, terwijl je zelf bepaalt hoeveel verpakkingen je
        werkelijk koopt.
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setChecked(
              Object.fromEntries(lines.map((line) => [line.product.id, true])),
            )
          }
          className="touch-button rounded-xl bg-jumbo px-5 py-3 text-sm font-black"
        >
          Alles controleren
        </button>
        <button
          onClick={copy}
          disabled={!lines.length}
          className="touch-button rounded-xl border border-line bg-white px-5 py-3 text-sm font-black disabled:opacity-40"
        >
          Lijst kopiëren
        </button>
        <button
          onClick={exportCsv}
          disabled={!lines.length}
          className="touch-button rounded-xl border border-line bg-white px-5 py-3 text-sm font-black disabled:opacity-40"
        >
          Exporteer CSV
        </button>
        <button
          onClick={openIntegration}
          className="touch-button order-first w-full rounded-xl bg-jumbo px-5 py-3 text-sm font-black text-ink shadow-lg ring-2 ring-ink sm:w-auto"
        >
          Voeg toe aan Jumbo-winkelmand
        </button>
        <button
          onClick={() => setConfirmClear(true)}
          disabled={!lines.length}
          className="touch-button ml-auto flex items-center gap-2 rounded-xl bg-[#982f24] px-5 py-3 text-sm font-black text-white disabled:opacity-40"
        >
          <Icon name="trash" size={18} /> Lijst leegmaken
        </button>
      </div>
      {!lines.length ? (
        <Empty
          title="Je boodschappenlijst is leeg"
          text="Ga naar Boodschappen om nieuwe maaltijden en producten toe te voegen. Recepten, voorraad en eerdere bestellingen zijn behouden."
          action="Start met kiezen"
          onClick={() => go("Boodschappen")}
        />
      ) : (
        categories.map((category) => (
          <div
            key={category}
            className="mb-5 overflow-hidden rounded-2xl border border-line bg-white"
          >
            <div className="flex items-center justify-between bg-[#f1f1eb] px-5 py-4">
              <h2 className="font-black">{category}</h2>
              <span className="text-sm text-muted">
                {
                  lines.filter((line) => line.product.category === category)
                    .length
                }
              </span>
            </div>
            {lines
              .filter((line) => line.product.category === category)
              .map((line) => {
                const have = stock[line.product.id] || 0
                const buy = Math.max(0, line.packs - have)
                const manuallyAdjusted =
                  lineOverrides[line.product.id] !== undefined
                return (
                  <div
                    key={line.product.id}
                    className="grid gap-4 border-t border-line p-4 first:border-0 sm:grid-cols-[48px_72px_1fr] lg:grid-cols-[48px_72px_1fr_auto] lg:items-center"
                  >
                    <button
                      onClick={() =>
                        setChecked((value) => ({
                          ...value,
                          [line.product.id]: !value[line.product.id],
                        }))
                      }
                      aria-label={`${line.product.name} controleren`}
                      className={`grid h-12 w-12 place-items-center rounded-xl border ${
                        checked[line.product.id]
                          ? "border-jumbo bg-jumbo"
                          : "border-[#c8c8c0]"
                      }`}
                    >
                      {checked[line.product.id] && (
                        <Icon name="check" size={20} />
                      )}
                    </button>
                    <Image
                      width={900}
                      height={600}
                      src={line.product.image || FALLBACK_IMAGE}
                      alt=""
                      className="h-[72px] w-[72px] rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <strong className="block text-base">
                        {line.product.brand} {line.product.name}
                      </strong>
                      <p className="mt-1 text-sm text-muted">
                        Berekend: {Math.round(line.required * 10) / 10}{" "}
                        {line.unit} · {line.product.packageLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Nodig voor: {line.sources.join(", ")}
                      </p>
                      {manuallyAdjusted && (
                        <span className="mt-2 inline-flex rounded-full bg-jumbo-soft px-2.5 py-1 text-xs font-black">
                          Handmatig aangepast
                        </span>
                      )}
                    </div>
                    <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 lg:col-span-1 lg:border-0 lg:pt-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPacks(line, line.packs - 1)}
                          aria-label="Eén verpakking minder"
                          className="touch-icon border border-line bg-white"
                        >
                          <Icon name="minus" size={20} />
                        </button>
                        <div className="min-w-20 text-center">
                          <strong className="block text-xl">{buy}×</strong>
                          <small className="text-muted">kopen</small>
                        </div>
                        <button
                          onClick={() => setPacks(line, line.packs + 1)}
                          aria-label="Eén verpakking meer"
                          className="touch-icon bg-jumbo"
                        >
                          <Icon name="plus" size={20} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingLine(line)}
                          className="touch-button flex items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-black"
                        >
                          <Icon name="edit" size={17} /> Bewerk
                        </button>
                        <button
                          onClick={() => setPacks(line, 0)}
                          className="touch-button flex items-center gap-2 rounded-xl border border-[#e2b4ae] bg-[#fff4f2] px-4 text-sm font-black text-[#8e3025]"
                        >
                          <Icon name="trash" size={17} /> Verwijder
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setStock((value) => ({
                            ...value,
                            [line.product.id]: have ? 0 : 1,
                          }))
                        }
                        className={`touch-button rounded-xl border px-4 text-sm font-black ${
                          have
                            ? "border-jumbo bg-jumbo-soft"
                            : "border-line bg-white"
                        }`}
                      >
                        {have ? "1 in voorraad" : "Heb ik al"}
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        ))
      )}
      {editingLine && (
        <ListLineEditor
          line={editingLine}
          close={() => setEditingLine(null)}
          save={(packs) => {
            setPacks(editingLine, packs)
            setEditingLine(null)
            flash("Aantal verpakkingen aangepast")
          }}
        />
      )}
      {integrationOpen && integrationJob && (
        <Modal
          title="Voeg toe aan Jumbo-winkelmand"
          close={() => setIntegrationOpen(false)}
          wide
        >
          <div className="rounded-2xl border border-[#e2b85b] bg-jumbo-soft p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#725b00]">
                  Verbinding niet ingesteld
                </p>
                <h3 className="mt-1 text-xl font-black">
                  De lokale Python-service is nog niet gekoppeld
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                  Deze website kan geen script op je computer of Raspberry Pi
                  starten. De uiteindelijke koppeling krijgt een beveiligde
                  agent die opdrachten ophaalt en statussen terugmeldt.
                  Jumbo-cookies en wachtwoorden blijven uitsluitend in dat
                  lokale Python-proces.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-xs font-black">
                Nog niet verzonden
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-4">
              <small className="font-bold text-muted">
                Klaar om te versturen
              </small>
              <strong className="mt-1 block text-3xl">
                {integrationJob.items.length}
              </strong>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <small className="font-bold text-muted">
                Handmatige controle
              </small>
              <strong className="mt-1 block text-3xl">
                {integrationJob.missing_identifiers.length}
              </strong>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <small className="font-bold text-muted">Opdrachtstatus</small>
              <strong className="mt-2 block text-sm">
                {integrationStatusLabels[integrationJob.status]}
              </strong>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted">
                  Unieke bestelopdracht
                </p>
                <code className="mt-1 block break-all text-sm font-bold">
                  {integrationJob.job_id}
                </code>
              </div>
              <span className="rounded-full bg-[#f1f1eb] px-3 py-2 text-xs font-bold">
                Schema v{integrationJob.schema_version}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">
              Bij opnieuw klikken met dezelfde lijst blijft dit opdracht-ID
              behouden. Een toekomstige server weigert dankzij dit ID een
              dubbele uitvoering.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-lg font-black">Voortgang per product</h3>
            <p className="mt-1 text-sm text-muted">
              Succes wordt pas getoond nadat de Python-agent dit expliciet heeft
              teruggemeld.
            </p>
            <div className="mt-3 space-y-3">
              {integrationJob.items.map((item) => (
                <div
                  key={item.item_id}
                  className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <strong className="block">{item.product_name}</strong>
                    <p className="mt-1 text-sm text-muted">
                      {item.variant} · {item.requested_quantity}×
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item.identifier_type}: {item.identifier}
                    </p>
                  </div>
                  <span className="rounded-full bg-jumbo-soft px-3 py-2 text-xs font-black">
                    {integrationItemStatusLabels[item.status]}
                  </span>
                  {(item.found_product_name || item.message) && (
                    <div className="sm:col-span-2 rounded-xl bg-[#f3f3ee] p-3 text-sm">
                      {item.found_product_name && (
                        <p>
                          Gevonden: <strong>{item.found_product_name}</strong>
                        </p>
                      )}
                      {item.packaging_matches !== undefined && (
                        <p>
                          Verpakking:{" "}
                          {item.packaging_matches ? "komt overeen" : "wijkt af"}
                        </p>
                      )}
                      {item.added_quantity !== undefined && (
                        <p>Toegevoegd: {item.added_quantity}×</p>
                      )}
                      {item.message && <p>{item.message}</p>}
                    </div>
                  )}
                </div>
              ))}
              {integrationJob.missing_identifiers.map((item) => (
                <div
                  key={item.product_id}
                  className="grid gap-3 rounded-2xl border border-[#e2b4ae] bg-[#fff4f2] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <strong className="block">{item.product_name}</strong>
                    <p className="mt-1 text-sm text-muted">
                      {item.quantity}× · {item.reason}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#8e3025]">
                    Handmatige controle
                  </span>
                </div>
              ))}
              {!integrationJob.items.length &&
                !integrationJob.missing_identifiers.length && (
                  <p className="rounded-xl bg-[#f3f3ee] p-4 text-sm text-muted">
                    De actieve boodschappenlijst is leeg.
                  </p>
                )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <h3 className="font-black">Beschikbare terugvalopties</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() =>
                  downloadText(
                    "jumbo-opdracht.json",
                    JSON.stringify(integrationJob, null, 2),
                    "application/json",
                  )
                }
                className="touch-button rounded-xl bg-jumbo px-4 text-sm font-black"
              >
                Download opdracht JSON
              </button>
              <button
                onClick={() =>
                  downloadText(
                    "jumbo-python-export.csv",
                    jumboRowsToCsv(pythonExport.rows),
                    "text/csv",
                  )
                }
                className="touch-button rounded-xl border border-line bg-white px-4 text-sm font-black"
              >
                Download Python CSV
              </button>
              <button
                onClick={() =>
                  downloadText(
                    "jumbo-identifiers.txt",
                    jumboRowsToTxt(pythonExport.rows),
                    "text/plain",
                  )
                }
                className="touch-button rounded-xl border border-line bg-white px-4 text-sm font-black"
              >
                Download minimale TXT
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-ink-deep p-4 text-sm text-white">
            <strong>Veilige grens:</strong> een productcode garandeert geen
            unieke Jumbo-match. De Python-agent moet product en verpakking
            controleren en bij nul of meerdere resultaten stoppen.
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wider text-muted">
              Ondersteunde toekomstige opdrachtstatussen
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.values(integrationStatusLabels).map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line bg-white px-3 py-2 text-xs font-bold"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Weet je zeker dat je de hele boodschappenlijst wilt leegmaken?"
          text="Alle producten en geselecteerde items uit de huidige lijst worden verwijderd. Je productdatabase, recepten, voorraad en bestelgeschiedenis blijven behouden."
          confirmLabel="Ja, lijst leegmaken"
          destructive
          cancel={() => setConfirmClear(false)}
          confirm={() => {
            clearCart()
            setConfirmClear(false)
            flash("De actieve boodschappenlijst is leeggemaakt")
          }}
        />
      )}
    </section>
  )
}
function ListLineEditor({
  line,
  close,
  save,
}: {
  line: MergedCartLine
  close: () => void
  save: (packs: number) => void
}) {
  const [packs, setPacks] = useState(line.packs)
  return (
    <Modal title={`${line.product.name} aanpassen`} close={close}>
      <div className="rounded-2xl bg-[#f3f3ee] p-4">
        <p className="text-sm text-muted">Berekende behoefte</p>
        <strong className="mt-1 block text-lg">
          {Math.round(line.required * 10) / 10} {line.unit}
        </strong>
        <p className="mt-1 text-sm text-muted">
          Verpakking: {line.product.packageLabel}
        </p>
      </div>
      <Field label="Aantal verpakkingen dat je wilt kopen">
        <input
          type="number"
          min="0"
          step="1"
          value={packs}
          onChange={(event) =>
            setPacks(Math.max(0, Number(event.target.value)))
          }
          className="form-input"
        />
      </Field>
      <p className="mt-3 text-sm text-muted">
        Deze wijziging geldt alleen voor de huidige bestelling. Het recept en
        product blijven ongewijzigd.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={close}
          className="touch-button rounded-xl border border-line bg-white px-5 font-black"
        >
          Annuleren
        </button>
        <button
          onClick={() => save(Math.floor(packs))}
          className="touch-button rounded-xl bg-jumbo px-5 font-black"
        >
          Opslaan
        </button>
      </div>
    </Modal>
  )
}
function Inventory({
  products,
  stock,
  setStock,
}: {
  products: Product[]
  stock: Record<string, number>
  setStock: React.Dispatch<React.SetStateAction<Record<string, number>>>
}) {
  const stocked = products.filter((product) => stock[product.id])
  return (
    <section>
      <PageTitle
        eyebrow="Voorraad thuis"
        title="Wat hebben we al?"
        sub="Deze lokale voorraad wordt direct verrekend op het boodschappenlijstje."
      />
      <div className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-black">Gemarkeerd als aanwezig</h2>
        {stocked.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {stocked.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl bg-[#f4f4ef] p-3"
              >
                <Image
                  width={900}
                  height={600}
                  src={product.image || FALLBACK_IMAGE}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <strong className="block text-sm">{product.name}</strong>
                  <small className="text-muted">
                    {stock[product.id]} verpakking
                  </small>
                </div>
                <button
                  onClick={() =>
                    setStock((value) => ({ ...value, [product.id]: 0 }))
                  }
                  className="text-xs font-black underline"
                >
                  Verwijder
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Markeer producten vanuit je boodschappenlijst als aanwezig.
          </p>
        )}
      </div>
    </section>
  )
}
function Orders({ lines }: { lines: MergedCartLine[] }) {
  const delivery = new Date()
  delivery.setDate(delivery.getDate() + 3)
  return (
    <section>
      <PageTitle
        eyebrow="Planning en geschiedenis"
        title="Bestellingen"
        sub="Bezorgmomenten en eerdere bestellingen blijven in deze prototypefase lokaal opgeslagen."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[26px] bg-ink-deep p-6 text-white">
          <p className="text-xs font-black uppercase tracking-wider text-jumbo">
            Volgende bezorging
          </p>
          <h2 className="mt-3 text-2xl font-black">
            {delivery.toLocaleDateString("nl-NL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <p className="mt-1 text-white/60">18:00–20:00 · fictieve testdata</p>
          <div className="mt-6 rounded-xl bg-white/10 p-4">
            <strong>{lines.length} producten klaargezet</strong>
            <p className="mt-1 text-sm text-white/60">
              Controleer de lijst vóór handmatige overdracht.
            </p>
          </div>
        </div>
        <div className="rounded-[26px] border border-line bg-white p-6">
          <p className="text-xs font-black uppercase tracking-wider text-muted">
            Gegevensbron
          </p>
          <h3 className="mt-3 text-xl font-black">Handmatig ingevoerd</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Een officiële Jumbo-winkelwagen-API is niet beschikbaar. Deze app
            doet daarom geen onterechte belofte van automatische overdracht.
          </p>
          <div className="mt-5 rounded-xl bg-jumbo-soft px-4 py-3 text-sm font-bold text-ink">
            De huidige voorbeeldbestelling staat al gepland.
          </div>
        </div>
      </div>
    </section>
  )
}

type ProductFormState = {
  recordId?: string
  id?: string
  name: string
  brand: string
  category: GroceryCategory
  menuCategory: MenuCategory
  code: string
  ean: string
  packageLabel: string
  packageSize: string
  unit: string
  price: string
  image: string
  imageRecordId?: string
  storage: StorageType
  preferred: boolean
  enabled: boolean
  alternativeIds: string[]
}

type RecipeFormState = {
  recordId?: string
  id?: string
  name: string
  category: MenuCategory
  description: string
  image: string
  imageRecordId?: string
  servings: string
  minutes: string
  notes: string
  enabled: boolean
  ingredients: RecipeIngredient[]
}

const emptyProductForm = (products: Product[] = []): ProductFormState => ({
  name: "",
  brand: "Jumbo",
  category: "Overig",
  menuCategory: "Dagelijkse boodschappen",
  code: "",
  ean: "",
  packageLabel: "Pak 500 g",
  packageSize: "500",
  unit: "g",
  price: "2.49",
  image: products[0]?.image || "",
  storage: "Houdbaar",
  preferred: false,
  enabled: true,
  alternativeIds: [],
})

const emptyRecipeForm = (products: Product[]): RecipeFormState => ({
  name: "",
  category: "Pasta & gerechten",
  description: "",
  image: "",
  servings: "4",
  minutes: "30",
  notes: "",
  enabled: true,
  ingredients: products[0]
    ? [
        {
          id: `ingredient-${Date.now()}`,
          name: products[0].name,
          productId: products[0].id,
          quantity: 1,
          unit: products[0].unit,
        },
      ]
    : [],
})
function Admin({
  products,
  setProducts,
  recipes,
  setRecipes,
  cart,
  setCart,
  stock,
  flash,
}: {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  recipes: Recipe[]
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  stock: Record<string, number>
  flash: (message: string) => void
}) {
  const [tab, setTab] = useState<"producten" | "recepten" | "koppelingen">(
    "producten",
  )
  const [productForm, setProductForm] = useState<ProductFormState>(() =>
    emptyProductForm(products),
  )
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(() =>
    emptyRecipeForm(products),
  )
  const [error, setError] = useState("")
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleteRecipe, setDeleteRecipe] = useState<Recipe | null>(null)

  const editProduct = (product: Product) => {
    setError("")
    setProductForm({
      recordId: product.recordId,
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      menuCategory: product.menuCategory,
      code: product.code || "",
      ean: product.ean || "",
      packageLabel: product.packageLabel,
      packageSize: String(product.packageSize),
      unit: product.unit,
      price: String(product.price),
      image: product.image,
      imageRecordId: product.imageRecordId,
      storage: product.storage,
      preferred: Boolean(product.preferred),
      enabled: product.enabled,
      alternativeIds: product.alternativeIds || [],
    })
    window.scrollTo({ top: 180, behavior: "smooth" })
  }
  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    const packageSize = Number(productForm.packageSize)
    const price = Number(productForm.price)
    if (
      !productForm.name.trim() ||
      !productForm.brand.trim() ||
      !productForm.packageLabel.trim() ||
      !productForm.unit.trim()
    ) {
      setError("Vul productnaam, merk, verpakking en eenheid in.")
      return
    }
    if (
      !Number.isFinite(packageSize) ||
      packageSize <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Verpakkingsgrootte moet groter zijn dan nul en de prijs mag niet negatief zijn.",
      )
      return
    }
    const saved: Product = {
      recordId: productForm.recordId || "",
      id: productForm.id || `custom-${Date.now()}`,
      name: productForm.name.trim(),
      brand: productForm.brand.trim(),
      category: productForm.category,
      menuCategory: productForm.menuCategory,
      code: productForm.code.trim() || undefined,
      ean: productForm.ean.trim() || undefined,
      packageLabel: productForm.packageLabel.trim(),
      packageSize,
      unit: productForm.unit.trim(),
      price,
      image: productForm.image.trim(),
      imageRecordId: productForm.imageRecordId,
      storage: productForm.storage,
      preferred: productForm.preferred,
      enabled: productForm.enabled,
      alternativeIds: productForm.alternativeIds.filter(
        (id) => id !== productForm.id,
      ),
    }
    const result = await saveProductAction(saved)
    if (!result.ok || !result.recordId) {
      setError(result.error || "Product opslaan is mislukt.")
      return
    }
    const persisted = { ...saved, recordId: result.recordId }
    setProducts((current) =>
      productForm.id
        ? current.map((product) =>
            product.id === productForm.id ? persisted : product,
          )
        : [...current, persisted],
    )
    setProductForm(emptyProductForm(products))
    setError("")
    flash(
      productForm.id
        ? "Productwijzigingen opgeslagen"
        : "Product toegevoegd aan de catalogus",
    )
  }

  const editRecipe = (recipe: Recipe) => {
    setError("")
    setRecipeForm({
      recordId: recipe.recordId,
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      image: recipe.image,
      imageRecordId: recipe.imageRecordId,
      servings: String(recipe.servings),
      minutes: String(recipe.minutes),
      notes: recipe.notes || "",
      enabled: recipe.enabled,
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        alternativeProductIds: ingredient.alternativeProductIds || [],
      })),
    })
    window.scrollTo({ top: 180, behavior: "smooth" })
  }
  const saveRecipe = async (event: React.FormEvent) => {
    event.preventDefault()
    const servings = Number(recipeForm.servings)
    const minutes = Number(recipeForm.minutes)
    if (!recipeForm.name.trim() || !recipeForm.description.trim()) {
      setError("Vul receptnaam, omschrijving en afbeelding in.")
      return
    }
    if (
      !Number.isFinite(servings) ||
      servings < 1 ||
      !Number.isFinite(minutes) ||
      minutes < 1 ||
      recipeForm.ingredients.length === 0
    ) {
      setError(
        "Een recept heeft minimaal één eter, één minuut en één ingrediënt nodig.",
      )
      return
    }
    if (
      recipeForm.ingredients.some(
        (ingredient) =>
          !ingredient.productId ||
          ingredient.quantity <= 0 ||
          !ingredient.unit.trim(),
      )
    ) {
      setError(
        "Controleer de productkoppeling, hoeveelheid en eenheid van ieder ingrediënt.",
      )
      return
    }
    const saved: Recipe = {
      recordId: recipeForm.recordId || "",
      id: recipeForm.id || `custom-recipe-${Date.now()}`,
      name: recipeForm.name.trim(),
      category: recipeForm.category,
      description: recipeForm.description.trim(),
      image: recipeForm.image.trim(),
      imageRecordId: recipeForm.imageRecordId,
      servings,
      minutes,
      notes: recipeForm.notes.trim() || undefined,
      enabled: recipeForm.enabled,
      ingredients: recipeForm.ingredients,
    }
    const result = await saveRecipeAction(saved)
    if (!result.ok || !result.recordId) {
      setError(result.error || "Recept opslaan is mislukt.")
      return
    }
    const persisted = { ...saved, recordId: result.recordId }
    setRecipes((current) =>
      recipeForm.id
        ? current.map((recipe) =>
            recipe.id === recipeForm.id ? persisted : recipe,
          )
        : [...current, persisted],
    )
    setRecipeForm(emptyRecipeForm(products))
    setError("")
    flash(
      recipeForm.id
        ? "Receptwijzigingen opgeslagen"
        : "Recept toegevoegd aan het menu",
    )
  }

  const updateIngredient = (index: number, patch: Partial<RecipeIngredient>) =>
    setRecipeForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }))

  const moveIngredient = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= recipeForm.ingredients.length) return
    setRecipeForm((current) => {
      const ingredients = [...current.ingredients]
      ;[ingredients[index], ingredients[target]] = [
        ingredients[target],
        ingredients[index],
      ]
      return { ...current, ingredients }
    })
  }

  const productReferences = deleteProduct
    ? recipes.filter((recipe) =>
        recipe.ingredients.some(
          (ingredient) =>
            ingredient.productId === deleteProduct.id ||
            ingredient.alternativeProductIds?.includes(deleteProduct.id),
        ),
      )
    : []
  const productAlternativeReferences = deleteProduct
    ? products.filter((product) =>
        product.alternativeIds?.includes(deleteProduct.id),
      )
    : []
  const productInCart = deleteProduct
    ? cart.some((item) =>
        item.kind === "product"
          ? item.productId === deleteProduct.id
          : item.kind === "avg"
            ? item.productIds.includes(deleteProduct.id)
            : false,
      )
    : false
  const productInStock = deleteProduct
    ? Boolean(stock[deleteProduct.id])
    : false
  const recipeInCart = deleteRecipe
    ? cart.some(
        (item) => item.kind === "meal" && item.recipeId === deleteRecipe.id,
      )
    : false

  return (
    <section>
      <PageTitle
        eyebrow="Gedeelde beheeromgeving"
        title="Producten en recepten beheren"
        sub="Bewerk catalogusrecords zonder stabiele interne ID's of bestaande koppelingen te verliezen."
      />
      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {(["producten", "recepten", "koppelingen"] as const).map((item) => (
          <button
            key={item}
            onClick={() => {
              setTab(item)
              setError("")
            }}
            className={`touch-button rounded-xl px-5 text-sm font-black capitalize ${
              tab === item ? "bg-jumbo" : "border border-line bg-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-5 rounded-xl border border-[#e2b4ae] bg-[#fff4f2] p-4 text-sm font-bold text-[#8e3025]">
          {error}
        </div>
      )}

      {tab === "producten" && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <AdminForm
            title={productForm.id ? "Product bewerken" : "Nieuw product"}
            onSubmit={saveProduct}
          >
            {productForm.id && (
              <p className="rounded-xl bg-jumbo-soft p-3 text-xs">
                <strong>Interne ID blijft behouden:</strong> {productForm.id}
              </p>
            )}
            <Field label="Productnaam *">
              <input
                required
                value={productForm.name}
                onChange={(event) =>
                  setProductForm({ ...productForm, name: event.target.value })
                }
                className="form-input"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Merk *">
                <input
                  required
                  value={productForm.brand}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      brand: event.target.value,
                    })
                  }
                  className="form-input"
                />
              </Field>
              <Field label="Prijs">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      price: event.target.value,
                    })
                  }
                  className="form-input"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Boodschappencategorie">
                <select
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      category: event.target.value as GroceryCategory,
                    })
                  }
                  className="form-input"
                >
                  {([
                    "Groente en fruit",
                    "Aardappelen, rijst en pasta",
                    "Vlees en vis",
                    "Zuivel, kaas en eieren",
                    "Brood en beleg",
                    "Dranken",
                    "Snacks",
                    "Huishouden",
                    "Overig",
                  ] as GroceryCategory[]).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Menucategorie">
                <select
                  value={productForm.menuCategory}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      menuCategory: event.target.value as MenuCategory,
                    })
                  }
                  className="form-input"
                >
                  {menuCategories.map((category) => (
                    <option key={category.name}>{category.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Jumbo-productcode">
                <input
                  value={productForm.code}
                  onChange={(event) =>
                    setProductForm({ ...productForm, code: event.target.value })
                  }
                  className="form-input"
                />
              </Field>
              <Field label="EAN">
                <input
                  inputMode="numeric"
                  value={productForm.ean}
                  onChange={(event) =>
                    setProductForm({ ...productForm, ean: event.target.value })
                  }
                  className="form-input"
                />
              </Field>
            </div>
            <Field label="Verpakkingsomschrijving *">
              <input
                required
                value={productForm.packageLabel}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    packageLabel: event.target.value,
                  })
                }
                className="form-input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nettohoeveelheid *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={productForm.packageSize}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      packageSize: event.target.value,
                    })
                  }
                  className="form-input"
                />
              </Field>
              <Field label="Eenheid *">
                <input
                  required
                  value={productForm.unit}
                  onChange={(event) =>
                    setProductForm({ ...productForm, unit: event.target.value })
                  }
                  className="form-input"
                />
              </Field>
            </div>
            <Field label="Afbeeldings-URL">
              <input
                type="url"
                value={productForm.image}
                onChange={(event) =>
                  setProductForm({ ...productForm, image: event.target.value })
                }
                className="form-input"
              />
            </Field>
            <Field label="Producttype">
              <select
                value={productForm.storage}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    storage: event.target.value as StorageType,
                  })
                }
                className="form-input"
              >
                {([
                  "Gekoeld",
                  "Houdbaar",
                  "Diepvries",
                  "Vers",
                ] as StorageType[]).map((storage) => (
                  <option key={storage}>{storage}</option>
                ))}
              </select>
            </Field>
            <Field label="Alternatieve producten">
              <div className="max-h-40 space-y-2 overflow-auto rounded-xl border border-line p-3">
                {products
                  .filter((product) => product.id !== productForm.id)
                  .map((product) => (
                    <label
                      key={product.id}
                      className="flex min-h-11 items-center gap-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={productForm.alternativeIds.includes(
                          product.id,
                        )}
                        onChange={() =>
                          setProductForm({
                            ...productForm,
                            alternativeIds: productForm.alternativeIds.includes(
                              product.id,
                            )
                              ? productForm.alternativeIds.filter(
                                  (id) => id !== product.id,
                                )
                              : [...productForm.alternativeIds, product.id],
                          })
                        }
                        className="h-5 w-5 accent-[#f9c900]"
                      />
                      {product.name}
                    </label>
                  ))}
              </div>
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#f3f3ee] px-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={productForm.preferred}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      preferred: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-[#f9c900]"
                />
                Voorkeursproduct
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#f3f3ee] px-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={productForm.enabled}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      enabled: event.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-[#f9c900]"
                />
                Actief in menu
              </label>
            </div>
            <div className="flex gap-3">
              <button className="touch-button flex-1 rounded-xl bg-jumbo px-4 font-black">
                {productForm.id ? "Wijzigingen opslaan" : "Product toevoegen"}
              </button>
              {productForm.id && (
                <button
                  type="button"
                  onClick={() => setProductForm(emptyProductForm(products))}
                  className="touch-button rounded-xl border border-line bg-white px-4 font-black"
                >
                  Annuleren
                </button>
              )}
            </div>
          </AdminForm>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center"
              >
                <Image
                  width={900}
                  height={600}
                  src={product.image || FALLBACK_IMAGE}
                  alt=""
                  className="h-[72px] w-[72px] rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <strong className="block text-base">{product.name}</strong>
                  <p className="mt-1 text-sm text-muted">
                    {product.brand} · {product.packageLabel} ·{" "}
                    {money(product.price)}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted">
                    ID: {product.id} · Jumbo: {product.code || "niet ingevuld"}{" "}
                    · EAN: {product.ean || "niet ingevuld"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    onClick={() => editProduct(product)}
                    className="touch-button flex items-center gap-2 rounded-xl border border-line px-4 text-sm font-black"
                  >
                    <Icon name="edit" size={17} /> Bewerken
                  </button>
                  <button
                    onClick={() =>
                      setProducts((current) =>
                        current.map((entry) =>
                          entry.id === product.id
                            ? { ...entry, enabled: !entry.enabled }
                            : entry,
                        ),
                      )
                    }
                    className={`touch-button rounded-xl px-4 text-sm font-black ${
                      product.enabled
                        ? "bg-jumbo-soft"
                        : "bg-[#ededE7] text-muted"
                    }`}
                  >
                    {product.enabled ? "Actief" : "Uitgeschakeld"}
                  </button>
                  <button
                    onClick={() => setDeleteProduct(product)}
                    className="touch-button flex items-center gap-2 rounded-xl border border-[#e2b4ae] px-4 text-sm font-black text-[#8e3025]"
                  >
                    <Icon name="trash" size={17} /> Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "recepten" && (
        <div className="grid gap-6 xl:grid-cols-[500px_1fr]">
          <AdminForm
            title={recipeForm.id ? "Recept bewerken" : "Nieuw recept"}
            onSubmit={saveRecipe}
          >
            {recipeForm.id && (
              <p className="rounded-xl bg-jumbo-soft p-3 text-xs">
                <strong>Recept-ID blijft behouden:</strong> {recipeForm.id}
              </p>
            )}
            <Field label="Receptnaam *">
              <input
                required
                value={recipeForm.name}
                onChange={(event) =>
                  setRecipeForm({ ...recipeForm, name: event.target.value })
                }
                className="form-input"
              />
            </Field>
            <Field label="Omschrijving *">
              <textarea
                required
                rows={3}
                value={recipeForm.description}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    description: event.target.value,
                  })
                }
                className="form-input"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Categorie">
                <select
                  value={recipeForm.category}
                  onChange={(event) =>
                    setRecipeForm({
                      ...recipeForm,
                      category: event.target.value as MenuCategory,
                    })
                  }
                  className="form-input"
                >
                  <option>AVG & stamppot</option>
                  <option>Pasta & gerechten</option>
                </select>
              </Field>
              <Field label="Afbeeldings-URL">
                <input
                  type="url"
                  value={recipeForm.image}
                  onChange={(event) =>
                    setRecipeForm({ ...recipeForm, image: event.target.value })
                  }
                  className="form-input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Standaard personen">
                <input
                  type="number"
                  min="1"
                  value={recipeForm.servings}
                  onChange={(event) =>
                    setRecipeForm({
                      ...recipeForm,
                      servings: event.target.value,
                    })
                  }
                  className="form-input"
                />
              </Field>
              <Field label="Bereidingstijd">
                <input
                  type="number"
                  min="1"
                  value={recipeForm.minutes}
                  onChange={(event) =>
                    setRecipeForm({
                      ...recipeForm,
                      minutes: event.target.value,
                    })
                  }
                  className="form-input"
                />
              </Field>
            </div>
            <Field label="Bereidingsnotities">
              <textarea
                rows={3}
                value={recipeForm.notes}
                onChange={(event) =>
                  setRecipeForm({ ...recipeForm, notes: event.target.value })
                }
                className="form-input"
              />
            </Field>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black">Ingrediënten</h3>
                <button
                  type="button"
                  onClick={() => {
                    const product =
                      products.find((item) => item.enabled) || products[0]
                    if (!product) return
                    setRecipeForm((current) => ({
                      ...current,
                      ingredients: [
                        ...current.ingredients,
                        {
                          id: `ingredient-${Date.now()}`,
                          name: product.name,
                          productId: product.id,
                          quantity: 1,
                          unit: product.unit,
                        },
                      ],
                    }))
                  }}
                  className="touch-button flex items-center gap-2 rounded-xl bg-jumbo px-4 text-sm font-black"
                >
                  <Icon name="plus" size={17} /> Ingrediënt
                </button>
              </div>
              <div className="space-y-3">
                {recipeForm.ingredients.map((ingredient, index) => (
                  <div
                    key={ingredient.id}
                    className="rounded-2xl border border-line bg-[#f7f7f3] p-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Naam">
                        <input
                          value={ingredient.name}
                          onChange={(event) =>
                            updateIngredient(index, {
                              name: event.target.value,
                            })
                          }
                          className="form-input"
                        />
                      </Field>
                      <Field label="Gekoppeld product">
                        <select
                          value={ingredient.productId}
                          onChange={(event) => {
                            const product = products.find(
                              (item) => item.id === event.target.value,
                            )
                            updateIngredient(index, {
                              productId: event.target.value,
                              name: product?.name || ingredient.name,
                            })
                          }}
                          className="form-input"
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}{" "}
                              {!product.enabled && "(uitgeschakeld)"}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Field label="Hoeveelheid">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(event) =>
                            updateIngredient(index, {
                              quantity: Number(event.target.value),
                            })
                          }
                          className="form-input"
                        />
                      </Field>
                      <Field label="Eenheid">
                        <input
                          value={ingredient.unit}
                          onChange={(event) =>
                            updateIngredient(index, {
                              unit: event.target.value,
                            })
                          }
                          className="form-input"
                        />
                      </Field>
                    </div>
                    <Field label="Alternatieven">
                      <select
                        multiple
                        value={ingredient.alternativeProductIds || []}
                        onChange={(event) =>
                          updateIngredient(index, {
                            alternativeProductIds: [
                              ...event.target.selectedOptions,
                            ].map((option) => option.value),
                          })
                        }
                        className="form-input min-h-28"
                      >
                        {products
                          .filter(
                            (product) => product.id !== ingredient.productId,
                          )
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveIngredient(index, -1)}
                        className="touch-button rounded-xl border border-line bg-white px-4 text-sm font-black disabled:opacity-30"
                      >
                        Omhoog
                      </button>
                      <button
                        type="button"
                        disabled={index === recipeForm.ingredients.length - 1}
                        onClick={() => moveIngredient(index, 1)}
                        className="touch-button rounded-xl border border-line bg-white px-4 text-sm font-black disabled:opacity-30"
                      >
                        Omlaag
                      </button>
                      <button
                        type="button"
                        disabled={recipeForm.ingredients.length === 1}
                        onClick={() =>
                          setRecipeForm((current) => ({
                            ...current,
                            ingredients: current.ingredients.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        className="touch-button ml-auto flex items-center gap-2 rounded-xl border border-[#e2b4ae] px-4 text-sm font-black text-[#8e3025] disabled:opacity-30"
                      >
                        <Icon name="trash" size={16} /> Verwijder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#f3f3ee] px-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={recipeForm.enabled}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    enabled: event.target.checked,
                  })
                }
                className="h-5 w-5 accent-[#f9c900]"
              />
              Actief in bestelmenu
            </label>
            <div className="flex gap-3">
              <button className="touch-button flex-1 rounded-xl bg-jumbo px-4 font-black">
                {recipeForm.id ? "Wijzigingen opslaan" : "Recept toevoegen"}
              </button>
              {recipeForm.id && (
                <button
                  type="button"
                  onClick={() => setRecipeForm(emptyRecipeForm(products))}
                  className="touch-button rounded-xl border border-line bg-white px-4 font-black"
                >
                  Annuleren
                </button>
              )}
            </div>
          </AdminForm>
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center"
              >
                <Image
                  width={900}
                  height={600}
                  src={recipe.image || FALLBACK_IMAGE}
                  alt=""
                  className="h-[72px] w-[72px] rounded-xl object-cover"
                />
                <div>
                  <strong>{recipe.name}</strong>
                  <p className="mt-1 text-sm text-muted">
                    {recipe.category} · {recipe.servings} personen ·{" "}
                    {recipe.ingredients.length} ingrediënten
                  </p>
                  <p className="mt-1 text-xs text-muted">ID: {recipe.id}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    onClick={() => editRecipe(recipe)}
                    className="touch-button flex items-center gap-2 rounded-xl border border-line px-4 text-sm font-black"
                  >
                    <Icon name="edit" size={17} /> Bewerken
                  </button>
                  <button
                    onClick={() =>
                      setRecipes((current) =>
                        current.map((entry) =>
                          entry.id === recipe.id
                            ? { ...entry, enabled: !entry.enabled }
                            : entry,
                        ),
                      )
                    }
                    className={`touch-button rounded-xl px-4 text-sm font-black ${
                      recipe.enabled
                        ? "bg-jumbo-soft"
                        : "bg-[#ededE7] text-muted"
                    }`}
                  >
                    {recipe.enabled ? "Actief" : "Uitgeschakeld"}
                  </button>
                  <button
                    onClick={() => setDeleteRecipe(recipe)}
                    className="touch-button flex items-center gap-2 rounded-xl border border-[#e2b4ae] px-4 text-sm font-black text-[#8e3025]"
                  >
                    <Icon name="trash" size={17} /> Verwijderen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "koppelingen" && (
        <div className="rounded-[26px] border border-line bg-white p-6">
          <h2 className="text-xl font-black">
            Receptingrediënt naar winkelproduct
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Een ingrediënt is bewust niet hetzelfde als een winkelverpakking.
            Hieronder zie je de handmatige voorkeurskoppelingen; een Jumbo-code
            wordt nooit automatisch verzonnen.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="py-3">Recept</th>
                  <th>Ingrediënt</th>
                  <th>Voorkeursproduct</th>
                  <th>Productcode</th>
                </tr>
              </thead>
              <tbody>
                {recipes.flatMap((recipe) =>
                  recipe.ingredients.map((ingredient) => {
                    const product = products.find(
                      (entry) => entry.id === ingredient.productId,
                    )
                    return (
                      <tr
                        key={`${recipe.id}-${ingredient.id}`}
                        className="border-b border-line last:border-0"
                      >
                        <td className="py-4 font-bold">{recipe.name}</td>
                        <td>
                          {ingredient.name} · {ingredient.quantity}{" "}
                          {ingredient.unit}
                        </td>
                        <td>
                          {product?.brand} {product?.name}
                        </td>
                        <td className="text-muted">
                          {product?.code || "Niet ingevuld"}
                        </td>
                      </tr>
                    )
                  }),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteProduct && (
        <ConfirmDialog
          title={
            productReferences.length ||
            productAlternativeReferences.length ||
            productInCart ||
            productInStock
              ? "Dit product is nog in gebruik"
              : `Product “${deleteProduct.name}” verwijderen?`
          }
          text={
            productReferences.length ||
            productAlternativeReferences.length ||
            productInCart ||
            productInStock
              ? `Het product wordt nog gebruikt door ${[
                  ...productReferences.map((recipe) => recipe.name),
                  ...productAlternativeReferences.map(
                    (product) => `alternatief van ${product.name}`,
                  ),
                  ...(productInCart ? ["de huidige bestelling"] : []),
                  ...(productInStock ? ["de voorraad"] : []),
                ].join(
                  ", ",
                )}. Het record wordt daarom veilig uitgeschakeld en niet verwijderd.`
              : "Het product wordt definitief uit de gedeelde productdatabase verwijderd. Recepten en voorraad worden niet aangepast."
          }
          confirmLabel={
            productReferences.length ||
            productAlternativeReferences.length ||
            productInCart ||
            productInStock
              ? "Product deactiveren"
              : "Product verwijderen"
          }
          destructive
          cancel={() => setDeleteProduct(null)}
          confirm={async () => {
            if (
              productReferences.length ||
              productAlternativeReferences.length ||
              productInCart ||
              productInStock
            ) {
              const result = await saveProductAction({
                ...deleteProduct,
                enabled: false,
              })
              if (!result.ok) {
                setError(result.error || "Product deactiveren is mislukt.")
                setDeleteProduct(null)
                return
              }
              setProducts((current) =>
                current.map((product) =>
                  product.id === deleteProduct.id
                    ? { ...product, enabled: false }
                    : product,
                ),
              )
            } else {
              const result = await deleteProductAction(deleteProduct.recordId)
              if (!result.ok) {
                setError(result.error || "Product verwijderen is mislukt.")
                setDeleteProduct(null)
                return
              }
              setProducts((current) =>
                current.filter((product) => product.id !== deleteProduct.id),
              )
            }
            setDeleteProduct(null)
            flash(
              productReferences.length ||
                productAlternativeReferences.length ||
                productInCart ||
                productInStock
                ? "Product veilig gedeactiveerd"
                : "Product verwijderd",
            )
          }}
        />
      )}
      {deleteRecipe && (
        <ConfirmDialog
          title={`Recept “${deleteRecipe.name}” verwijderen?`}
          text={
            recipeInCart
              ? "Dit recept staat in de huidige winkelmand. Bij bevestigen wordt alleen deze geplande maaltijd mee uit de actieve winkelmand verwijderd; producten en andere recepten blijven behouden."
              : "Het recept wordt uit de gedeelde receptdatabase verwijderd. Productrecords blijven behouden."
          }
          confirmLabel="Recept verwijderen"
          destructive
          cancel={() => setDeleteRecipe(null)}
          confirm={async () => {
            const result = await deleteRecipeAction(deleteRecipe.recordId)
            if (!result.ok) {
              setError(result.error || "Recept verwijderen is mislukt.")
              setDeleteRecipe(null)
              return
            }
            setRecipes((current) =>
              current.filter((recipe) => recipe.id !== deleteRecipe.id),
            )
            if (recipeInCart)
              setCart((current) =>
                current.filter(
                  (item) =>
                    item.kind !== "meal" || item.recipeId !== deleteRecipe.id,
                ),
              )
            setDeleteRecipe(null)
            flash("Recept verwijderd")
          }}
        />
      )}
    </section>
  )
}
function ConfirmDialog({
  title,
  text,
  confirmLabel,
  destructive = false,
  cancel,
  confirm,
}: {
  title: string
  text: string
  confirmLabel: string
  destructive?: boolean
  cancel: () => void
  confirm: () => void
}) {
  return (
    <Modal title={title} close={cancel}>
      <p className="text-base leading-relaxed text-muted">{text}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={cancel}
          className="touch-button rounded-xl border border-line bg-white px-5 font-black"
        >
          Annuleren
        </button>
        <button
          onClick={confirm}
          className={`touch-button rounded-xl px-5 font-black ${
            destructive ? "bg-[#982f24] text-white" : "bg-jumbo"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
function AdminForm({
  title,
  onSubmit,
  children,
}: {
  title: string
  onSubmit: (event: React.FormEvent) => void
  children: React.ReactNode
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="h-fit space-y-4 rounded-[26px] border border-line bg-white p-5 lg:sticky lg:top-24"
    >
      <h2 className="text-xl font-black">{title}</h2>
      {children}
    </form>
  )
}
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}
function Counter({
  value,
  onMinus,
  onPlus,
  dark = false,
  label,
}: {
  value: number
  onMinus: () => void
  onPlus: () => void
  dark?: boolean
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onMinus}
        type="button"
        disabled={value <= 1}
        aria-label="Verlagen"
        className={`grid h-12 w-12 place-items-center rounded-xl border disabled:opacity-30 ${
          dark
            ? "border-white/20 bg-white/10 text-white"
            : "border-line bg-white"
        }`}
      >
        <Icon name="minus" size={16} />
      </button>
      <strong className="min-w-7 text-center text-lg">{value}</strong>
      <button
        onClick={onPlus}
        type="button"
        aria-label="Verhogen"
        className="grid h-12 w-12 place-items-center rounded-xl bg-jumbo text-ink"
      >
        <Icon name="plus" size={16} />
      </button>
      {label && <span className="ml-1 text-xs text-white/60">{label}</span>}
    </div>
  )
}
function Stat({ value, label }: StatProps) {
  return (
    <div>
      <strong className="block text-xl sm:text-2xl">{value}</strong>
      <span className="text-xs text-white/55">{label}</span>
    </div>
  )
}
function InfoCard({ title, text }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <span className="mb-4 block h-1.5 w-10 rounded-full bg-jumbo" />
      <h3 className="font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}
function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string
  close: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-ink-deep/55 p-3 sm:p-5"
      onMouseDown={close}
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-auto rounded-[28px] bg-canvas shadow-2xl ${
          wide ? "max-w-5xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            onClick={close}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f1eb]"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
function Drawer({
  close,
  children,
}: {
  close: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[65] bg-ink-deep/45" onMouseDown={close}>
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-auto rounded-t-[30px] bg-canvas p-4"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#b7b7af]" />
        {children}
      </div>
    </div>
  )
}
function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string
  text: string
  action?: string
  onClick?: () => void
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-[#c6c6be] bg-white p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-jumbo-soft">
        <Icon name="plus" />
      </span>
      <h2 className="mt-4 text-lg font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
      {action && (
        <button
          onClick={onClick}
          className="mt-5 rounded-xl bg-jumbo px-4 py-2.5 text-sm font-black"
        >
          {action}
        </button>
      )}
    </div>
  )
}
