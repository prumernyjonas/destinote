# Základní kódové syntaxe - Průvodce

Tento dokument vysvětluje základní syntaxe TypeScript, React a Next.js používané v projektu.

---

## 📘 TYPESCRIPT - Základy

### 1. Typy proměnných

```typescript
// Základní typy
const name: string = "Jan";           // Text
const age: number = 25;               // Číslo
const isActive: boolean = true;       // Pravda/Nepravda
const items: string[] = ["a", "b"];  // Pole textů
const user: { name: string; age: number } = { name: "Jan", age: 25 }; // Objekt

// Null/Undefined
const value: string | null = null;    // Může být text nebo null
const data: string | undefined = undefined; // Může být text nebo undefined
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 47
const [articles, setArticles] = useState<Article[]>([]);
// articles je pole objektů typu Article
```

### 2. Interface (Definice struktury objektu)

```typescript
// Definice struktury
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;  // ? = volitelný parametr
}

// Použití
const user: User = {
  id: "123",
  name: "Jan",
  email: "jan@example.com"
  // age není povinné
};
```

**Příklad z projektu:**
```typescript
// src/components/ui/Button.tsx, řádek 5
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
// ButtonProps rozšiřuje ButtonHTMLAttributes a přidává vlastní vlastnosti
```

### 3. Funkce

```typescript
// Normální funkce
function add(a: number, b: number): number {
  return a + b;
}

// Arrow funkce (šipková)
const multiply = (a: number, b: number): number => {
  return a * b;
};

// Async funkce (asynchronní - čeká na výsledek)
async function fetchData(): Promise<string> {
  const response = await fetch("/api/data");
  return response.json();
}
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 8
export async function POST(req: Request) {
  // async = asynchronní funkce
  // Promise = vrací slib výsledku
  const body = await req.json(); // await = čeká na výsledek
  return NextResponse.json({ success: true });
}
```

### 4. Destructuring (Rozbalení objektu/pole)

```typescript
// Rozbalení objektu
const user = { name: "Jan", age: 25, email: "jan@example.com" };
const { name, age } = user; // name = "Jan", age = 25

// Rozbalení pole
const numbers = [1, 2, 3];
const [first, second] = numbers; // first = 1, second = 2

// S výchozí hodnotou
const { name = "Neznámý" } = user;
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 45
const { countryId } = body as { countryId?: string };
// Rozbalí countryId z objektu body
```

### 5. Optional chaining (?.) a Nullish coalescing (??)

```typescript
// Optional chaining - bezpečný přístup k vlastnostem
const name = user?.profile?.name; // Pokud user nebo profile je null, vrátí undefined

// Nullish coalescing - výchozí hodnota
const displayName = user?.name ?? "Neznámý"; // Pokud name je null/undefined, použije "Neznámý"
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 26
const sessionUserId = auth?.user?.id;
// Bezpečně získá id, i když auth nebo user je null
```

---

## ⚛️ REACT - Základy

### 1. Komponenta (Component)

```typescript
// Funkční komponenta
function MyComponent() {
  return <div>Ahoj světe!</div>;
}

// S parametry (props)
interface Props {
  name: string;
  age: number;
}

function UserCard({ name, age }: Props) {
  return (
    <div>
      <h1>{name}</h1>
      <p>Věk: {age}</p>
    </div>
  );
}
```

**Příklad z projektu:**
```typescript
// src/components/ui/Button.tsx, řádek 11
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return <button className={className}>{children}</button>;
  }
);
```

### 2. JSX (JavaScript XML)

```typescript
// JSX vypadá jako HTML, ale je to JavaScript
return (
  <div className="container">
    <h1>Nadpis</h1>
    <p>Text {variable}</p>  {/* {} = vložení JavaScriptu */}
    {isActive && <button>Klikni</button>}  {/* Podmíněné zobrazení */}
  </div>
);
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 447
{articles.map((article) => (
  <Link key={article.id} href={`/clanek/${article.slug}`}>
    <div>{article.title}</div>
  </Link>
))}
```

### 3. State (Stav komponenty)

```typescript
import { useState } from "react";

function Counter() {
  // useState vytvoří stav a funkci pro jeho změnu
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Počet: {count}</p>
      <button onClick={() => setCount(count + 1)}>Zvýšit</button>
    </div>
  );
}
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 47-50
const [articles, setArticles] = useState<Article[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
// articles = aktuální hodnota, setArticles = funkce pro změnu
```

### 4. useEffect (Side effects - vedlejší efekty)

```typescript
import { useEffect } from "react";

function MyComponent() {
  const [data, setData] = useState(null);
  
  // useEffect se spustí po vykreslení komponenty
  useEffect(() => {
    // Načtení dat
    fetch("/api/data")
      .then(res => res.json())
      .then(data => setData(data));
  }, []); // [] = spustí se jen jednou při načtení
  
  // useEffect s závislostmi
  useEffect(() => {
    console.log("Data se změnilo:", data);
  }, [data]); // Spustí se pokaždé, když se změní data
}
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 89-104
useEffect(() => {
  async function loadCountries() {
    try {
      const res = await fetch("/api/countries/list");
      if (res.ok) {
        const data = await res.json();
        setCountries(data.data);
      }
    } catch (err) {
      console.error("Chyba:", err);
    }
  }
  loadCountries();
}, []); // Spustí se jen jednou při načtení stránky
```

### 5. useRef (Reference na DOM element)

```typescript
import { useRef } from "react";

function MyComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    // Přístup k DOM elementu
    inputRef.current?.focus();
  };
  
  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Fokus</button>
    </div>
  );
}
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 58
const countryDropdownRef = useRef<HTMLDivElement>(null);
// Uchovává referenci na DOM element
```

### 6. Conditional rendering (Podmíněné zobrazení)

```typescript
// && operátor
{isLoading && <div>Načítám...</div>}

// Ternary operátor (ternární)
{isLoggedIn ? <UserMenu /> : <LoginButton />}

// Více podmínek
{error && <div>Chyba: {error}</div>}
{!error && data && <div>Data: {data}</div>}
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 412
{loading ? (
  // Zobrazí se při načítání
  [...Array(6)].map((_, i) => <Skeleton key={i} />)
) : articles.length === 0 ? (
  // Zobrazí se pokud nejsou články
  <div>Žádné články</div>
) : (
  // Zobrazí se články
  articles.map(article => <ArticleCard key={article.id} />)
)}
```

---

## 🚀 NEXT.JS - Základy

### 1. Server Component vs Client Component

```typescript
// Server Component (výchozí) - běží na serveru
// src/app/page.tsx
export default async function HomePage() {
  const data = await fetch("/api/data"); // Může používat await
  return <div>{data}</div>;
}

// Client Component - běží v prohlížeči
// src/app/komunita/page.tsx
"use client"; // Musí být na začátku

import { useState } from "react";

export default function CommunityPage() {
  const [count, setCount] = useState(0); // Může používat hooks
  return <div>{count}</div>;
}
```

**Příklad z projektu:**
```typescript
// src/app/komunita/page.tsx, řádek 1
"use client"; // Client component - může používat useState, useEffect
```

### 2. API Route (API endpoint)

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET request
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Ahoj" });
}

// POST request
export async function POST(req: NextRequest) {
  const body = await req.json(); // Načtení dat z requestu
  return NextResponse.json({ success: true, data: body });
}
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 8
export async function POST(req: Request) {
  const body = await req.json(); // Načte data z requestu
  const { countryId } = body;    // Rozbalí countryId
  // ... logika ...
  return NextResponse.json({ success: true });
}
```

### 3. Async/Await (Asynchronní kód)

```typescript
// async = funkce je asynchronní
// await = čeká na dokončení asynchronní operace

async function fetchUser() {
  // await čeká na dokončení fetch
  const response = await fetch("/api/user");
  const data = await response.json(); // await čeká na převedení na JSON
  return data;
}

// Použití
const user = await fetchUser();
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 19
const { data: auth, error: authError } = await supabase.auth.getUser();
// await čeká na dokončení autentifikace
```

### 4. Try/Catch (Zachycení chyb)

```typescript
try {
  // Kód, který může selhat
  const data = await fetchData();
  console.log(data);
} catch (error) {
  // Co se stane při chybě
  console.error("Chyba:", error);
  // Vrátit chybovou odpověď
  return NextResponse.json({ error: "Něco se pokazilo" }, { status: 500 });
}
```

**Příklad z projektu:**
```typescript
// src/app/api/visited/country/route.ts, řádek 9-112
export async function POST(req: Request) {
  try {
    // ... hlavní logika ...
    return NextResponse.json({ success: true });
  } catch (error) {
    // Zachytí jakoukoli chybu
    console.error("Exception:", error);
    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 }
    );
  }
}
```

---

## 🎯 PRAKTICKÉ PŘÍKLADY Z PROJEKTU

### 1. Komponenta s props a state

```typescript
// src/app/komunita/page.tsx
"use client";

export default function CommunityPage() {
  // State - proměnné, které se mohou měnit
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // useEffect - načte data při načtení stránky
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      const res = await fetch("/api/articles");
      const data = await res.json();
      setArticles(data.items);
      setLoading(false);
    }
    loadArticles();
  }, []);
  
  // Podmíněné zobrazení
  if (loading) return <div>Načítám...</div>;
  
  return (
    <div>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### 2. API endpoint s validací

```typescript
// src/app/api/visited/country/route.ts
export async function POST(req: Request) {
  try {
    // 1. Získání userId z requestu
    const userIdFromHeader = req.headers.get("x-user-id");
    const userId = userIdFromHeader || sessionUserId;
    
    // 2. Validace - kontrola, jestli máme userId
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 3. Načtení dat z requestu
    const body = await req.json();
    const { countryId } = body;
    
    // 4. Validace countryId
    if (!countryId) {
      return NextResponse.json(
        { error: "Missing countryId" },
        { status: 400 }
      );
    }
    
    // 5. Uložení do databáze
    const { error } = await admin
      .from("user_visited_countries")
      .upsert({ user_id: userId, country_id: countryId });
    
    // 6. Vrácení odpovědi
    return NextResponse.json({ success: true });
    
  } catch (error) {
    // Zachycení chyb
    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500 }
    );
  }
}
```

### 3. Hook s context

```typescript
// src/hooks/useAuth.tsx
"use client";

// 1. Vytvoření contextu
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider komponenta
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 3. Funkce pro přihlášení
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    const userData = await authUtils.login(credentials);
    setUser(userData);
    setLoading(false);
  };
  
  // 4. Vrácení contextu
  return (
    <AuthContext.Provider value={{ user, loading, login }}>
      {children}
    </AuthContext.Provider>
  );
}

// 5. Hook pro použití contextu
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

---

## 📝 ČASTÉ VZORY V PROJEKTU

### 1. Načtení dat z API

```typescript
useEffect(() => {
  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (err) {
      setError("Chyba při načítání");
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, []);
```

### 2. Odeslání formuláře

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault(); // Zabraňuje obnovení stránky
  
  try {
    setSubmitting(true);
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    
    if (res.ok) {
      toast.success("Úspěch!");
      router.push("/dashboard");
    }
  } catch (err) {
    toast.error("Chyba!");
  } finally {
    setSubmitting(false);
  }
};
```

### 3. Podmíněné zobrazení s loading

```typescript
{loading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage message={error} />
) : data ? (
  <DataDisplay data={data} />
) : (
  <EmptyState />
)}
```

### 4. Mapování pole do komponent

```typescript
{items.map((item) => (
  <ItemCard key={item.id} item={item} />
))}

// S indexem
{items.map((item, index) => (
  <ItemCard key={item.id} index={index} item={item} />
))}
```

---

## 🔑 KLÍČOVÁ SLOVA - Slovníček

- **const/let** - Deklarace proměnné (const = neměnná, let = měnitelná)
- **interface** - Definice struktury objektu
- **type** - Alias pro typ
- **function** - Funkce
- **async/await** - Asynchronní kód
- **useState** - React hook pro stav
- **useEffect** - React hook pro side effects
- **useRef** - React hook pro referenci
- **export/import** - Export a import modulů
- **return** - Vrácení hodnoty
- **try/catch** - Zachycení chyb
- **if/else** - Podmínka
- **map** - Procházení pole
- **filter** - Filtrování pole
- **find** - Nalezení prvku v poli

---

## 💡 TIPY

1. **TypeScript typy** - Vždy definujte typy, pomůže to odhalit chyby
2. **Async/Await** - Používejte pro asynchronní operace (API, databáze)
3. **Try/Catch** - Vždy obalte rizikový kód do try/catch
4. **useState** - Pro data, která se mění a ovlivňují zobrazení
5. **useEffect** - Pro načtení dat, event listenery, cleanup
6. **Conditional rendering** - Používejte && nebo ternary pro podmíněné zobrazení

---

**Tento dokument by vám měl pomoci porozumět základům syntaxe v projektu! 🚀**
