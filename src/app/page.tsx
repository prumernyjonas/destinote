"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiCamera,
  FiFlag,
  FiGlobe,
  FiMap,
  FiSend,
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
  FiEdit3,
  FiUserPlus,
  FiCreditCard,
  FiClock,
  FiUser,
} from "react-icons/fi";
import PublicWorldMap from "@/components/PublicWorldMap";
import FlightsWidget from "@/components/flights/FlightsWidget";
import Globe from "@/components/Globe";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import GradientText from "@/components/ui/GradientText";

type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
};

// Pomocná funkce pro vytvoření slugu ze jména země
function countrySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const continents = [
  {
    name: "Afrika",
    slug: "afrika",
    items: [
      { name: "Maroko", continentSlug: "afrika" },
      { name: "Tanzánie", continentSlug: "afrika" },
      { name: "Keňa", continentSlug: "afrika" },
      { name: "Madagaskar", continentSlug: "afrika" },
      { name: "Libye", continentSlug: "afrika" },
    ],
  },
  {
    name: "Amerika",
    slug: "severni-amerika", // Použijeme severni-amerika jako základ, nebo můžeme vytvořit obecný slug
    items: [
      { name: "USA", continentSlug: "severni-amerika" },
      { name: "Kuba", continentSlug: "severni-amerika" },
      { name: "Peru", continentSlug: "jizni-amerika" },
      { name: "Kanada", continentSlug: "severni-amerika" },
      { name: "Brazílie", continentSlug: "jizni-amerika" },
    ],
  },
  {
    name: "Asie",
    slug: "asie",
    items: [
      { name: "Thajsko", continentSlug: "asie" },
      { name: "Indie", continentSlug: "asie" },
      { name: "Srí Lanka", continentSlug: "asie" },
      { name: "Vietnam", continentSlug: "asie" },
      { name: "Indonésie", continentSlug: "asie" },
    ],
  },
  {
    name: "Austrálie",
    slug: "australie",
    items: [
      { name: "Austrálie", continentSlug: "australie" },
      { name: "Nový Zéland", continentSlug: "australie" },
      { name: "Papua Nová Guinea", continentSlug: "australie" },
      { name: "Francouzská Polynésie", continentSlug: "australie" },
      { name: "Tuvalu", continentSlug: "australie" },
    ],
  },
  {
    name: "Evropa",
    slug: "evropa",
    items: [
      { name: "Polsko", continentSlug: "evropa" },
      { name: "Švýcarsko", continentSlug: "evropa" },
      { name: "Rakousko", continentSlug: "evropa" },
      { name: "Itálie", continentSlug: "evropa" },
      { name: "Chorvatsko", continentSlug: "evropa" },
    ],
  },
];

const features = [
  {
    icon: FiMap,
    title: "Interaktivní mapa",
    description: "Označte navštívené země a sledujte svou cestu kolem světa",
    color: "blue",
  },
  {
    icon: FiCamera,
    title: "Cestopisy a fotky",
    description: "Sdílejte své zážitky a inspirujte ostatní cestovatele",
    color: "emerald",
  },
  {
    icon: FiAward,
    title: "Gamifikace",
    description: "Získejte odznaky a body za každou novou destinaci",
    color: "amber",
  },
  {
    icon: FiUsers,
    title: "Komunita",
    description: "Sledujte přátele a objevujte nové destinace společně",
    color: "purple",
  },
  {
    icon: FiSend,
    title: "Letenky",
    description: "Rychlé odkazy na vyhledávače letenek podle destinace",
    color: "rose",
  },
  {
    icon: FiTrendingUp,
    title: "Žebříček",
    description: "Soutěžte s ostatními a posouvejte se v žebříčku",
    color: "indigo",
  },
];

const leaderboardPreview = [
  { name: "Anna K.", score: 4820, countries: 27, rank: 1 },
  { name: "Martin S.", score: 4510, countries: 24, rank: 2 },
  { name: "Lucie P.", score: 4260, countries: 22, rank: 3 },
];

function avatarColor(seed: string) {
  const palette = [
    "bg-travel-500",
    "bg-travel-600",
    "bg-travel-400",
    "bg-travel-700",
    "bg-travel-500",
  ];
  const idx = seed.charCodeAt(0) % palette.length;
  return palette[idx];
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingArticles(true);
      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Nepodařilo se načíst články");
        const data = await res.json();
        if (!cancelled) setArticles(data.items ?? []);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoadingArticles(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const articlePreview = useMemo(() => articles.slice(0, 3), [articles]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Globe Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Světelné efekty na pozadí */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(0,150,255,0.15)_0%,transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-0">
          {/* Text Content nahoře */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-20 text-center mb-12 sm:mb-16"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 text-white"
            >
              <GradientText
                colors={["#ffffff", "#e0f2fe", "#bae6fd"]}
                animationSpeed={7}
              >
                Destinote
              </GradientText>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl sm:text-2xl lg:text-3xl text-white/90 font-semibold max-w-3xl mx-auto mb-4"
            >
              Objevuj místa. Ukládej zážitky.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8"
            >
              Vytvoř si osobní mapu světa, ukládej navštívené země a sdílej své
              cesty s komunitou cestovatelů.
            </motion.p>

            {/* CTA Tlačítka */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="relative z-20 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/registrace">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl cursor-pointer">
                    Začít zdarma
                  </Button>
                </motion.div>
              </Link>
              <Link href="/zeme">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white px-8 py-4 text-lg font-bold cursor-pointer">
                    Prozkoumat mapu
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Globe dole - polokoule */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="relative z-0 -mt-16 sm:-mt-28 lg:-mt-32 xl:-mt-24 -mb-8"
          >
            <Globe />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Jak to funguje
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tři jednoduché kroky k vytvoření vlastní cestovatelské mapy
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              icon: FiCheckCircle,
              title: "Označ navštívené země",
              description:
                "Klikni na zemi na mapě a označ ji jako navštívenou.",
            },
            {
              step: "2",
              icon: FiEdit3,
              title: "Přidej články, fotky a tipy",
              description: "Sdílej své zážitky z cest s komunitou.",
            },
            {
              step: "3",
              icon: FiUserPlus,
              title: "Sleduj ostatní cestovatele",
              description: "Objevuj nové destinace díky příběhům ostatních.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm hover:shadow-lg transition-all duration-200"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 rounded-xl bg-travel-500 flex items-center justify-center text-white mb-4 shadow-lg"
              >
                <item.icon className="w-7 h-7" />
              </motion.div>
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Krok {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* World Map Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden"
        >
          <div className="bg-travel-600 px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Interaktivní mapa světa
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                    <FiMap className="w-3.5 h-3.5" />
                    Tip: klikni na zemi
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-95 sm:h-105 lg:h-125 bg-travel-50">
            <PublicWorldMap />
          </div>
          <div className="px-6 sm:px-8 py-5 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-gray-700">
                <FiFlag className="text-travel-600" />
                <span>195 zemí k objevení</span>
              </div>
              <Link
                href="/zeme"
                className="ml-auto inline-flex items-center gap-2 text-travel-600 font-semibold hover:text-travel-700 transition-colors"
              >
                Otevřít všechny země <FiArrowRight />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Continents Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Objevte svět po kontinentech
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Každý kontinent má svůj příběh. Začněte tam, kde vás to láká.
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-6">
          {continents.map((continent, index) => (
            <motion.div
              key={continent.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="flex-1 min-w-50 max-w-60"
            >
              <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-lg transition-all duration-200 h-full flex flex-col overflow-hidden">
                {/* Header s názvem kontinentu a ikonou */}
                <div className="px-5 py-4 border-b border-gray-200/70">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-travel-600 border border-travel-300 rounded-lg px-3 py-1.5 inline-block">
                      {continent.name}
                    </h3>
                    <FiMap className="w-6 h-6 text-travel-600 shrink-0" />
                  </div>
                </div>

                {/* Seznam zemí */}
                <div className="flex-1 px-5 py-5">
                  <ul className="space-y-2.5">
                    {continent.items.map((country) => (
                      <li key={country.name}>
                        <Link
                          href={`/zeme/${country.continentSlug}/${countrySlug(
                            country.name,
                          )}`}
                          className="block text-gray-700 hover:text-travel-600 transition-colors cursor-pointer"
                        >
                          {country.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tlačítko "Další země" */}
                <div className="px-5 py-4 border-t border-gray-200/70 mt-auto">
                  <Link
                    href={`/zeme/${continent.slug}`}
                    className="flex items-center justify-between text-travel-600 hover:text-travel-700 font-semibold text-sm border border-travel-300 rounded-lg px-3 py-2 bg-white hover:bg-travel-50 transition-all group"
                  >
                    <span>DALŠÍ ZEMĚ</span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features & Community */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Community Articles */}
        <div className="space-y-6 text-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nejnovější z komunity
            </h2>
            <p className="text-gray-600">
              Inspirujte se cestopisy od ostatních cestovatelů
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {loadingArticles &&
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden"
                >
                  <div className="h-48 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                    <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            {!loadingArticles && articlePreview.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Zatím žádné články
                </h3>
                <p className="text-gray-600 mb-6">
                  Buďte první a podělte se o svůj příběh z cest
                </p>
                <Link href="/clanek/novy">
                  <Button className="bg-travel-600 hover:bg-travel-700 text-white">
                    Přidat článek
                  </Button>
                </Link>
              </div>
            )}
            {!loadingArticles &&
              articlePreview.map((article) => (
                <Link
                  key={article.id}
                  href={`/clanek/${article.slug}`}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full">
                    <div className="relative h-48 bg-travel-50 overflow-hidden">
                      {article.main_image_url ? (
                        <img
                          src={article.main_image_url}
                          alt={article.main_image_alt || article.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiCamera className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-travel-600 flex items-center gap-1">
                        <FiUsers />
                        Komunita
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-xs text-gray-500 mb-2">
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString(
                              "cs-CZ",
                            )
                          : new Date(article.created_at).toLocaleDateString(
                              "cs-CZ",
                            )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-travel-600 transition-colors">
                        {article.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
          <Link href="/komunita">
            <Button
              variant="outline"
              className="border border-blue-900 hover:border-blue-900 hover:bg-blue-50 focus:border-blue-900 focus:ring-blue-900 text-blue-900 hover:text-blue-900 focus:text-blue-900 font-semibold cursor-pointer"
            >
              Zobrazit všechny články
            </Button>
          </Link>
        </div>
      </section>

      {/* 
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-6"> */}
      {/* Leaderboard */}
      {/* <Card className="border border-gray-200/70 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <CardHeader className="bg-travel-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <FiAward />
                  Žebříček
                </CardTitle>
                <CardDescription className="text-amber-100">
                  Top 3 cestovatelé
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {leaderboardPreview.map((user, idx) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-travel-300 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${avatarColor(
                        user.name
                      )} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-500">
                          #{user.rank}
                        </span>
                        <span className="text-xl">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-600">
                        {user.countries} zemí •{" "}
                        {user.score.toLocaleString("cs-CZ")} b
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/zebricek">
                  <Button
                    variant="outline"
                    className="w-full border border-gray-300 hover:border-travel-500 hover:text-travel-600 font-semibold"
                  >
                    Celý žebříček
                  </Button>
                </Link>
              </CardContent>
            </Card> */}

      {/* Flights */}
      {/* <div className="space-y-4">
              <FlightsWidget origin="PRG" limit={6} showTitle={true} />
              <Link href="/letenky">
                <Button
                  variant="outline"
                  className="w-full border border-gray-300 hover:border-travel-500 hover:text-travel-600 font-semibold"
                >
                  Více destinací
                </Button>
              </Link>
            </div> */}
      {/* </div> */}
      {/* </section> */}

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Vše, co potřebujete
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kompletní platforma pro všechny vaše cestovatelské potřeby
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm hover:shadow-lg transition-all duration-200"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 rounded-xl bg-travel-500 flex items-center justify-center text-white mb-4 shadow-lg transition-transform"
              >
                <feature.icon className="w-7 h-7" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-travel-600 rounded-2xl shadow-lg"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-size-[20px_20px]" />
          </div>
          <div className="relative text-center px-8 py-16">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Připojte se k tisícům cestovatelů
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Začněte mapovat své cesty ještě dnes. Registrace je zdarma a trvá
              jen minutu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button className="bg-white text-travel-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold shadow-xl">
                  Zaregistrovat se zdarma
                </Button>
              </Link>
              <Link href="/prihlaseni">
                <Button
                  variant="outline"
                  className="border border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-bold"
                >
                  Přihlásit se
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
