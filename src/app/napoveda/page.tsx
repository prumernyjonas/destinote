import Link from "next/link";
import {
  FiGlobe,
  FiMap,
  FiSearch,
  FiSettings,
  FiUser,
  FiUsers,
  FiAward,
  FiEdit3,
  FiLogIn,
  FiHelpCircle,
} from "react-icons/fi";

const sections = [
  {
    id: "uvod",
    icon: FiGlobe,
    title: "Co je Destinote",
    items: [
      "Destinote je cestovatelská aplikace: eviduješ v ní navštívené země, prohlížíš informace o státech, čteš a píšeš články a sleduješ nabídky letenek.",
      "Většinu obsahu můžeš prohlížet bez přihlášení. Pro ukládání navštívených zemí, články a osobní přehled je potřeba účet.",
    ],
  },
  {
    id: "registrace",
    icon: FiLogIn,
    title: "Registrace a přihlášení",
    items: [
      "V pravém horním rohu klikni na Přihlásit se. V registračním formuláři zadej e-mail, heslo a uživatelské jméno (nickname).",
      "Po registraci přijde na e-mail ověřovací odkaz – účet je aktivní až po jeho potvrzení.",
      "Přihlásit se můžeš i přes Google (tlačítko při přihlášení).",
      "Zapomněl jsi heslo? Na stránce přihlášení použij odkaz „Zapomenuté heslo“, zadej e-mail a postupuj podle instrukcí v mailu.",
    ],
  },
  {
    id: "profil",
    icon: FiUser,
    title: "Profil a navštívené země",
    items: [
      "Po přihlášení klikni na svou ikonu vpravo nahoře a zvol Můj profil.",
      "V profilu vidíš statistiky, navštívené země a interaktivní mapu. Na mapě klikni na zemi, kterou jsi navštívil – označí se a uloží se do tvého účtu. Omylem přidanou zemi můžeš stejným způsobem odebrat.",
      "Z profilu se dostaneš i ke svým článkům a nastavení.",
    ],
  },
  {
    id: "vyhledavani",
    icon: FiSearch,
    title: "Vyhledávání",
    items: [
      "V navigaci použij ikonu lupy nebo položku Hledat. Zadej alespoň dva znaky – zobrazí se výsledky: země a články.",
      "Kliknutím na výsledek přejdeš na detail země nebo na článek.",
    ],
  },
  {
    id: "zeme",
    icon: FiMap,
    title: "Země a kontinenty",
    items: [
      "V menu zvol Země. Nejprve vyber kontinent (Evropa, Asie, Afrika…), potom konkrétní zemi ze seznamu.",
      "Na stránce země najdeš základní informace, cestovní tipy a články od ostatních uživatelů. Odtud můžeš zemi přidat mezi navštívené (po přihlášení).",
    ],
  },
  {
    id: "komunita",
    icon: FiUsers,
    title: "Komunita a články",
    items: [
      "Sekce Komunita zobrazuje články od ostatních – cestovatelské zážitky, tipy a fotky. Články lze řadit (nejnovější, nejoblíbenější) a filtrovat podle země.",
      "Po přihlášení můžeš články lajkovat, přidávat komentáře a psát vlastní. Nový článek vytvoříš přes odkaz Nový článek (v menu nebo v komunitě) nebo z profilu.",
      "Své články můžeš spravovat v Dashboardu (přístup z menu po přihlášení).",
    ],
  },
  {
    id: "letenky",
    icon: FiGlobe,
    title: "Letenky",
    items: [
      "Sekce Letenky zobrazuje widget pro vyhledávání letů (např. z Prahy). Můžeš přepínat mezi nejlevnějšími dealy, všemi lety a pouze přímými lety.",
      "Widget vede na externí vyhledávání – slouží jako vstupní bod k porovnání cen.",
    ],
  },
  {
    id: "zebricek",
    icon: FiAward,
    title: "Žebříček",
    items: [
      "Žebříček ukazuje uživatele seřazené podle počtu navštívených zemí. U každého uvidíš pořadí, jméno, avatar a počet zemí.",
      "Slouží jako motivace k doplňování navštívených zemí a aktivnímu využívání aplikace.",
    ],
  },
  {
    id: "nastaveni",
    icon: FiSettings,
    title: "Nastavení účtu",
    items: [
      "V menu pod ikonou profilu zvol Nastavení. V sekci Osobní údaje můžeš měnit nickname, e-mail a profilovou fotku.",
      "V Bezpečnost změníš heslo. V Viditelnost a Ochrana dat nastavíš, co je o tobě veřejně vidět. V Oznámení zapneš nebo vypneš notifikace.",
    ],
  },
  {
    id: "clanky",
    icon: FiEdit3,
    title: "Vytváření a úprava článků",
    items: [
      "Nový článek: přejdi na Nový článek (např. z menu nebo Komunity), vyplň název, vyber zemi, napiš text a nahraj fotky. Můžeš uložit návrh nebo článek odeslat k zveřejnění.",
      "Úprava článku: v Dashboardu → Články vyber svůj článek a zvol Upravit. Po úpravách znovu ulož nebo odešli k publikaci.",
    ],
  },
];

export default function NapovedaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
            Nápověda
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            Jak pracovat s Destinote
          </h1>
          <p className="text-slate-600">
            Přehled hlavních funkcí: registrace, profil, mapa, země, komunita,
            letenky, žebříček a nastavení.
          </p>
        </header>

        <nav className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Rychlý přehled sekcí
          </p>
          <ul className="flex flex-wrap gap-2">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Icon className="size-4 shrink-0" />
                    {s.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="grid gap-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <article
                key={sec.id}
                id={sec.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm scroll-mt-6"
              >
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                  <Icon className="size-5 text-green-600 shrink-0" />
                  {sec.title}
                </h2>
                <ul className="mt-4 space-y-2 text-slate-700 list-disc list-inside">
                  {sec.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900">
            <FiHelpCircle className="size-5 text-green-600" />
            Potřebuješ poradit?
          </h3>
          <p className="mt-2 text-slate-700">
            Pokud něco nefunguje nebo si nejsi jistý postupem, napiš do komunity
            nebo na podporu – rádi pomůžeme. Pro podmínky užívání a ochranu dat
            viz{" "}
            <Link
              href="/podminky"
              className="text-green-600 hover:underline font-medium"
            >
              Podmínky
            </Link>{" "}
            a{" "}
            <Link
              href="/ochrana"
              className="text-green-600 hover:underline font-medium"
            >
              Ochrana osobních údajů
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
