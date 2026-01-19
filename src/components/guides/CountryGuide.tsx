// src/components/guides/CountryGuide.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import CountryMap from "./CountryMap";
import Link from "next/link";
import Image from "next/image";
import {
  FiMap,
  FiBookOpen,
  FiCamera,
  FiInfo,
  FiTrendingUp,
  FiUsers,
  FiEdit3,
  FiPlus,
} from "react-icons/fi";
import VisitedButton from "./VisitedButton";
import AddArticleButton from "./AddArticleButton";

type Props = {
  name: string;
  iso2?: string;
  continent: string;
  currentPath?: string;
};

type StoredSection = {
  id: string;
  title: string;
  text: string;
};

type StoredGuide = {
  intro: string;
  sections: StoredSection[];
};

type CountryStats = {
  visitorsCount: number;
  articlesCount: number;
  flagEmoji?: string;
};

type Article = {
  id: string;
  title: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  slug: string;
  published_at: string | null;
  created_at: string;
  destination: string | null;
};

type CountryInfo = {
  population?: number;
  capital?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol: string }>;
  area?: number; // v km²
};

async function fetchStoredGuide(iso2?: string): Promise<StoredGuide | null> {
  if (!iso2) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("ai_guides")
      .select("content")
      .eq("scope", "country")
      .eq("key", iso2.toUpperCase())
      .maybeSingle();
    if (error || !data?.content) return null;
    return data.content as StoredGuide;
  } catch {
    return null;
  }
}

async function fetchCountryStats(iso2?: string): Promise<CountryStats & { countryId?: string }> {
  if (!iso2) {
    return { visitorsCount: 0, articlesCount: 0 };
  }

  try {
    const admin = createAdminSupabaseClient();

    // Najít country_id podle ISO kódu
    const { data: countryData } = await admin
      .from("countries")
      .select("id, flag_emoji")
      .eq("iso_code", iso2.toUpperCase())
      .maybeSingle();

    if (!countryData?.id) {
      return { visitorsCount: 0, articlesCount: 0 };
    }

    const countryId = countryData.id;

    // Počet uživatelů, kteří navštívili zemi
    const { count: visitorsCount } = await admin
      .from("user_visited_countries")
      .select("*", { count: "exact", head: true })
      .eq("country_id", countryId);

    // Počet článků o zemi
    const { count: articlesCount } = await admin
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("country_id", countryId)
      .eq("status", "approved");

    return {
      visitorsCount: visitorsCount || 0,
      articlesCount: articlesCount || 0,
      flagEmoji: countryData.flag_emoji || undefined,
      countryId,
    };
  } catch {
    return { visitorsCount: 0, articlesCount: 0 };
  }
}

async function checkIfVisited(iso2: string): Promise<boolean> {
  if (!iso2) {
    console.log("[checkIfVisited] ❌ No ISO2 provided");
    return false;
  }
  
  try {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    
    if (!auth?.user?.id) {
      console.log("[checkIfVisited] ❌ No user ID (not logged in)");
      return false;
    }

    const userId = auth.user.id;
    const upperIso2 = iso2.toUpperCase();
    console.log(`[checkIfVisited] 🔍 Checking for userId: ${userId}, iso2: ${upperIso2}`);

    // Použít admin klienta kvůli RLS omezením
    const admin = createAdminSupabaseClient();
    
    // Načíst všechny navštívené země uživatele pro debugging
    const { data: allVisited, error: allVisitedError } = await admin
      .from("user_visited_countries")
      .select("country_id, countries ( id, iso_code, name )")
      .eq("user_id", userId);
    
    if (!allVisitedError && allVisited) {
      const visitedIso2s = allVisited
        .map((row: any) => row.countries?.iso_code)
        .filter(Boolean);
      console.log(`[checkIfVisited] 📋 User has ${visitedIso2s.length} visited countries:`, visitedIso2s);
    }
    
    // Najít country_id podle ISO2
    const { data: countryData, error: countryError } = await admin
      .from("countries")
      .select("id, iso_code, name")
      .eq("iso_code", upperIso2)
      .maybeSingle();

    if (countryError) {
      console.error("[checkIfVisited] ❌ Error finding country:", countryError);
      return false;
    }

    if (!countryData?.id) {
      console.log(`[checkIfVisited] ❌ Country not found for ISO2: ${upperIso2}`);
      return false;
    }

    console.log(`[checkIfVisited] ✅ Found country: ${countryData.name} (${countryData.iso_code}), countryId: ${countryData.id}`);

    // Zkontrolovat, jestli uživatel navštívil tuto zemi
    const { data, error } = await admin
      .from("user_visited_countries")
      .select("id, visited_at")
      .eq("user_id", userId)
      .eq("country_id", countryData.id)
      .maybeSingle();

    if (error) {
      console.error("[checkIfVisited] ❌ Error checking visited:", error);
      return false;
    }

    const isVisited = !!data;
    console.log(`[checkIfVisited] ${isVisited ? '✅' : '❌'} Country ${upperIso2} is ${isVisited ? 'VISITED' : 'NOT VISITED'} for user ${userId}`);
    if (data) {
      console.log(`[checkIfVisited] 📅 Visited at: ${data.visited_at}`);
    }

    return isVisited;
  } catch (error) {
    console.error("[checkIfVisited] ❌ Exception:", error);
    return false;
  }
}

// Mapování jazyků do češtiny
const LANGUAGE_TRANSLATIONS: Record<string, string> = {
  English: "Angličtina",
  Chinese: "Čínština",
  Malay: "Malajština",
  Tamil: "Tamilština",
  Spanish: "Španělština",
  French: "Francouzština",
  German: "Němčina",
  Italian: "Italština",
  Portuguese: "Portugalština",
  Russian: "Ruština",
  Japanese: "Japonština",
  Korean: "Korejština",
  Arabic: "Arabština",
  Hindi: "Hindština",
  Thai: "Thajština",
  Vietnamese: "Vietnamština",
  Indonesian: "Indonéština",
  Turkish: "Turečtina",
  Polish: "Polština",
  Czech: "Čeština",
  Slovak: "Slovenština",
  Hungarian: "Maďarština",
  Romanian: "Rumunština",
  Greek: "Řečtina",
  Dutch: "Nizozemština",
  Swedish: "Švédština",
  Norwegian: "Norština",
  Danish: "Dánština",
  Finnish: "Finština",
  Hebrew: "Hebrejština",
  Persian: "Perština",
  Urdu: "Urdština",
  Bengali: "Bengálština",
  Swahili: "Svahilština",
  Tagalog: "Tagalog",
  Ukrainian: "Ukrajinština",
  Bulgarian: "Bulharština",
  Croatian: "Chorvatština",
  Serbian: "Srbština",
  Slovenian: "Slovinština",
  Estonian: "Estonština",
  Latvian: "Lotyština",
  Lithuanian: "Litevština",
  Icelandic: "Islandština",
  Irish: "Irština",
  Welsh: "Velština",
  Maltese: "Maltština",
  Luxembourgish: "Lucemburština",
  Afrikaans: "Afrikánština",
  Zulu: "Zuluština",
  Xhosa: "Xhoština",
  Amharic: "Amharština",
  Hausa: "Hauština",
  Yoruba: "Jorubština",
  Igbo: "Igboština",
  Nepali: "Nepálština",
  Sinhala: "Sinhálština",
  Burmese: "Barmština",
  Khmer: "Khmerština",
  Lao: "Laoština",
  Mongolian: "Mongolština",
  Kazakh: "Kazaština",
  Uzbek: "Uzbekština",
  Kyrgyz: "Kyrgyzština",
  Tajik: "Tádžičtina",
  Turkmen: "Turkmenština",
  Azerbaijani: "Ázerbájdžánština",
  Armenian: "Arménština",
  Georgian: "Gruzínština",
  Albanian: "Albánština",
  Macedonian: "Makedonština",
  Bosnian: "Bosenština",
  Montenegrin: "Černohorština",
};

// Mapování měn do češtiny
const CURRENCY_TRANSLATIONS: Record<string, string> = {
  "Singapore dollar": "Singapurský dolar",
  "United States dollar": "Americký dolar",
  "Euro": "Euro",
  "British pound": "Britská libra",
  "Japanese yen": "Japonský jen",
  "Chinese yuan": "Čínský jüan",
  "Australian dollar": "Australský dolar",
  "Canadian dollar": "Kanadský dolar",
  "Swiss franc": "Švýcarský frank",
  "Swedish krona": "Švédská koruna",
  "Norwegian krone": "Norská koruna",
  "Danish krone": "Dánská koruna",
  "Polish zloty": "Polský zlotý",
  "Polish złoty": "Polský zlotý",
  "Czech koruna": "Česká koruna",
  "Hungarian forint": "Maďarský forint",
  "Romanian leu": "Rumunský leu",
  "Bulgarian lev": "Bulharský lev",
  "Croatian kuna": "Chorvatská kuna",
  "Turkish lira": "Turecká lira",
  "Russian ruble": "Ruský rubl",
  "Indian rupee": "Indická rupie",
  "Thai baht": "Thajský baht",
  "South Korean won": "Jihokorejský won",
  "Indonesian rupiah": "Indonéská rupie",
  "Malaysian ringgit": "Malajsijský ringgit",
  "Philippine peso": "Filipínské peso",
  "Vietnamese dong": "Vietnamský dong",
  "Brazilian real": "Brazílský real",
  "Mexican peso": "Mexické peso",
  "Argentine peso": "Argentinské peso",
  "Chilean peso": "Chilské peso",
  "Colombian peso": "Kolumbijské peso",
  "Peruvian sol": "Peruánský sol",
  "South African rand": "Jihoafrický rand",
  "Egyptian pound": "Egyptská libra",
  "Israeli new shekel": "Izraelský šekel",
  "Saudi riyal": "Saúdský rijál",
  "United Arab Emirates dirham": "Dirham Spojených arabských emirátů",
  "Qatari riyal": "Katarský rijál",
  "Kuwaiti dinar": "Kuvajtský dinár",
  "Bahraini dinar": "Bahrajnský dinár",
  "Omani rial": "Ománský rial",
  "Jordanian dinar": "Jordánský dinár",
  "Lebanese pound": "Libanonská libra",
  "Iraqi dinar": "Irácký dinár",
  "Iranian rial": "Íránský rial",
  "Pakistani rupee": "Pákistánská rupie",
  "Bangladeshi taka": "Bangladéšská taka",
  "Sri Lankan rupee": "Srílanská rupie",
  "Nepalese rupee": "Nepálská rupie",
  "Myanmar kyat": "Myanmarský kyat",
  "Cambodian riel": "Kambodžský riel",
  "Laotian kip": "Laoský kip",
  "Mongolian tugrik": "Mongolský tugrik",
  "Kazakhstani tenge": "Kazašský tenge",
  "Uzbekistani som": "Uzbecký som",
  "Kyrgystani som": "Kyrgyzský som",
  "Tajikistani somoni": "Tádžický somoni",
  "Turkmenistani manat": "Turkmenistánský manat",
  "Azerbaijani manat": "Ázerbájdžánský manat",
  "Armenian dram": "Arménský dram",
  "Georgian lari": "Gruzínský lari",
  "Ukrainian hryvnia": "Ukrajinská hřivna",
  "Belarusian ruble": "Běloruský rubl",
  "Moldovan leu": "Moldavský leu",
  "Albanian lek": "Albánský lek",
  "Macedonian denar": "Makedonský denár",
  "Bosnia-Herzegovina convertible mark": "Konvertibilní marka",
  "Serbian dinar": "Srbský dinár",
  "Montenegrin euro": "Euro",
  "Icelandic krona": "Islandská koruna",
  "Faroese krona": "Faerská koruna",
  "Gibraltar pound": "Gibraltarská libra",
  "Falkland Islands pound": "Falklandská libra",
  "New Zealand dollar": "Novozélandský dolar",
  "Fijian dollar": "Fidžijský dolar",
  "Papua New Guinean kina": "Papua-Novoguinejská kina",
  "Solomon Islands dollar": "Šalamounský dolar",
  "Vanuatu vatu": "Vanuatský vatu",
  "New Caledonian franc": "Novokaledonský frank",
  "CFP franc": "CFP frank",
  "Samoan tala": "Samojský tala",
  "Tongan paʻanga": "Tonžská paʻanga",
  "Cook Islands dollar": "Cookův dolar",
  "Niue dollar": "Niue dolar",
  "Pitcairn Islands dollar": "Pitcairnský dolar",
  "Tuvaluan dollar": "Tuvaluský dolar",
  "Nauruan dollar": "Nauruský dolar",
  "Palauan dollar": "Palauský dolar",
  "Micronesian dollar": "Mikronéský dolar",
  "Marshallese dollar": "Marshallský dolar",
  "Kiribati dollar": "Kiribatský dolar",
  "Moroccan dirham": "Marocký dirham",
  "Algerian dinar": "Alžírský dinár",
  "Tunisian dinar": "Tuniský dinár",
  "Libyan dinar": "Libyjský dinár",
  "Sudanese pound": "Súdánská libra",
  "Ethiopian birr": "Etiopský birr",
  "Kenyan shilling": "Keňský šilink",
  "Tanzanian shilling": "Tanzanský šilink",
  "Ugandan shilling": "Ugandský šilink",
  "Rwandan franc": "Rwandský frank",
  "Congolese franc": "Konžský frank",
  "Central African CFA franc": "CFA frank (Střední Afrika)",
  "West African CFA franc": "CFA frank (Západní Afrika)",
  "Nigerian naira": "Nigerijská naira",
  "Ghanaian cedi": "Ghanský cedi",
  "Gambian dalasi": "Gambijský dalasi",
  "Guinean franc": "Guinejský frank",
  "Sierra Leonean leone": "Sierraleonský leone",
  "Liberian dollar": "Liberijský dolar",
  "Ivorian franc": "Pobřežně slonovinový frank",
  "Burkina Faso franc": "Burkinafasijský frank",
  "Malian franc": "Malijský frank",
  "Nigerien franc": "Nigerský frank",
  "Chadian franc": "Čadský frank",
  "Cameroonian franc": "Kamerunský frank",
  "Equatorial Guinean franc": "Rovníkovoguinejský frank",
  "Gabonese franc": "Gabonský frank",
  "Republic of the Congo franc": "Konžský frank",
  "Central African Republic franc": "Středoafrický frank",
  "São Tomé and Príncipe dobra": "Dobra",
  "Angolan kwanza": "Angolská kwanza",
  "Zambian kwacha": "Zambijská kwacha",
  "Malawian kwacha": "Malawijská kwacha",
  "Botswana pula": "Botswanská pula",
  "Namibian dollar": "Namibijský dolar",
  "Lesotho loti": "Lesothský loti",
  "Swazi lilangeni": "Svazijský lilangeni",
  "Mauritian rupee": "Mauricijská rupie",
  "Seychellois rupee": "Seychelská rupie",
  "Comorian franc": "Komorský frank",
  "Djiboutian franc": "Džibutský frank",
  "Eritrean nakfa": "Eritrejská nakfa",
  "Somali shilling": "Somálský šilink",
  "Malagasy ariary": "Madagaskarský ariary",
  "Mozambican metical": "Mosambický metical",
  "Zimbabwean dollar": "Zimbabwský dolar",
  "Afghan afghani": "Afghánský afghání",
  "Bhutanese ngultrum": "Bhútánský ngultrum",
  "Brunei dollar": "Brunejský dolar",
  "East Caribbean dollar": "Východokaribský dolar",
  "Haitian gourde": "Haitský gourde",
  "Honduran lempira": "Honduraský lempira",
  "Jamaican dollar": "Jamajský dolar",
  "Mauritanian ouguiya": "Mauritánská ouguiya",
  "Nicaraguan córdoba": "Nikaragujský córdoba",
  "Paraguayan guaraní": "Paraguayský guaraní",
  "Surinamese dollar": "Surinamský dolar",
  "Trinidad and Tobago dollar": "Trinidadsko-tobagský dolar",
  "Uruguayan peso": "Uruguayské peso",
  "Venezuelan bolívar": "Venezuelský bolívar",
  "Yemeni rial": "Jemenský rial",
};

// Mapování hlavních měst do češtiny
const CAPITAL_TRANSLATIONS: Record<string, string> = {
  Singapore: "Singapur",
  London: "Londýn",
  Paris: "Paříž",
  Berlin: "Berlín",
  Rome: "Řím",
  Madrid: "Madrid",
  Amsterdam: "Amsterdam",
  Brussels: "Brusel",
  Vienna: "Vídeň",
  Prague: "Praha",
  Warsaw: "Varšava",
  Budapest: "Budapešť",
  Bucharest: "Bukurešť",
  Sofia: "Sofie",
  Athens: "Athény",
  Lisbon: "Lisabon",
  Dublin: "Dublin",
  Copenhagen: "Kodaň",
  Stockholm: "Stockholm",
  Oslo: "Oslo",
  Helsinki: "Helsinky",
  Reykjavik: "Reykjavík",
  Moscow: "Moskva",
  Kyiv: "Kyjev",
  Minsk: "Minsk",
  Tbilisi: "Tbilisi",
  Yerevan: "Jerevan",
  Baku: "Baku",
  Ankara: "Ankara",
  Istanbul: "Istanbul",
  Jerusalem: "Jeruzalém",
  "Tel Aviv": "Tel Aviv",
  Cairo: "Káhira",
  Tunis: "Tunis",
  Algiers: "Alžír",
  Rabat: "Rabat",
  Tripoli: "Tripolis",
  Khartoum: "Chartúm",
  "Addis Ababa": "Addis Abeba",
  Nairobi: "Nairobi",
  "Dar es Salaam": "Dar es Salaam",
  Kampala: "Kampala",
  Kigali: "Kigali",
  Kinshasa: "Kinshasa",
  Brazzaville: "Brazzaville",
  Libreville: "Libreville",
  Yaounde: "Yaoundé",
  Abuja: "Abuja",
  Accra: "Accra",
  Dakar: "Dakar",
  Bamako: "Bamako",
  Ouagadougou: "Ouagadougou",
  Niamey: "Niamey",
  "N'Djamena": "N'Djamena",
  Asmara: "Asmara",
  Djibouti: "Džibuti",
  Mogadishu: "Mogadišo",
  Antananarivo: "Antananarivo",
  "Port Louis": "Port Louis",
  Victoria: "Victoria",
  Moroni: "Moroni",
  Maputo: "Maputo",
  Harare: "Harare",
  Lusaka: "Lusaka",
  Lilongwe: "Lilongwe",
  Gaborone: "Gaborone",
  Windhoek: "Windhoek",
  Pretoria: "Pretorie",
  "Cape Town": "Kapské Město",
  Bloemfontein: "Bloemfontein",
  Maseru: "Maseru",
  Mbabane: "Mbabane",
  Beijing: "Peking",
  Shanghai: "Šanghaj",
  Tokyo: "Tokio",
  Seoul: "Soul",
  Pyongyang: "Pchjongjang",
  Ulaanbaatar: "Ulánbátar",
  Hanoi: "Hanoj",
  "Ho Chi Minh City": "Ho Či Minovo Město",
  "Phnom Penh": "Phnompenh",
  Vientiane: "Vientiane",
  Bangkok: "Bangkok",
  Yangon: "Yangon",
  Dhaka: "Dháka",
  Kathmandu: "Káthmándú",
  Thimphu: "Thimphu",
  "New Delhi": "Nové Dillí",
  Mumbai: "Mumbai",
  Karachi: "Karáčí",
  Islamabad: "Islámábád",
  Kabul: "Kábul",
  Tehran: "Teherán",
  Baghdad: "Bagdád",
  Damascus: "Damašek",
  Beirut: "Bejrút",
  Amman: "Amán",
  Riyadh: "Rijád",
  "Kuwait City": "Kuvajt",
  Manama: "Manáma",
  Doha: "Dauhá",
  "Abu Dhabi": "Abú Zabí",
  Dubai: "Dubaj",
  Muscat: "Maskat",
  Sanaa: "Saná",
  Colombo: "Kolombo",
  Malé: "Malé",
  Male: "Malé",
  "Bandar Seri Begawan": "Bandar Seri Begawan",
  Jakarta: "Jakarta",
  "Kuala Lumpur": "Kuala Lumpur",
  Manila: "Manila",
  Dili: "Díli",
  "Port Moresby": "Port Moresby",
  Honiara: "Honiara",
  "Port Vila": "Port Vila",
  Suva: "Suva",
  "Nuku'alofa": "Nuku'alofa",
  Apia: "Apia",
  Funafuti: "Funafuti",
  Tarawa: "Tarawa",
  Majuro: "Majuro",
  Palikir: "Palikir",
  Yaren: "Yaren",
  Ngerulmud: "Ngerulmud",
  Koror: "Koror",
  Melekeok: "Melekeok",
  Avarua: "Avarua",
  Alofi: "Alofi",
  Adamstown: "Adamstown",
  Kingston: "Kingston",
  Havana: "Havana",
  "Port-au-Prince": "Port-au-Prince",
  "Santo Domingo": "Santo Domingo",
  "San Juan": "San Juan",
  Bridgetown: "Bridgetown",
  Castries: "Castries",
  Kingstown: "Kingstown",
  "St. George's": "St. George's",
  Roseau: "Roseau",
  Basseterre: "Basseterre",
  "St. John's": "St. John's",
  "The Valley": "The Valley",
  "Road Town": "Road Town",
  "Cockburn Town": "Cockburn Town",
  Hamilton: "Hamilton",
  Ottawa: "Ottawa",
  Washington: "Washington",
  "Mexico City": "Ciudad de México",
  "Guatemala City": "Ciudad de Guatemala",
  Belmopan: "Belmopan",
  "San Salvador": "San Salvador",
  Tegucigalpa: "Tegucigalpa",
  Managua: "Managua",
  "San Jose": "San José",
  "Panama City": "Panama",
  Bogota: "Bogotá",
  Caracas: "Caracas",
  Georgetown: "Georgetown",
  Paramaribo: "Paramaribo",
  Cayenne: "Cayenne",
  Quito: "Quito",
  Lima: "Lima",
  "La Paz": "La Paz",
  Sucre: "Sucre",
  Asuncion: "Asunción",
  Santiago: "Santiago",
  "Buenos Aires": "Buenos Aires",
  Montevideo: "Montevideo",
  Brasilia: "Brasília",
  Stanley: "Stanley",
  Canberra: "Canberra",
  Wellington: "Wellington",
  "Port-aux-Français": "Port-aux-Français",
  "King Edward Point": "King Edward Point",
  Longyearbyen: "Longyearbyen",
};

function translateLanguage(lang: string): string {
  return LANGUAGE_TRANSLATIONS[lang] || lang;
}

function translateCurrency(currency: string): string {
  // Zkusit najít přesný název
  if (CURRENCY_TRANSLATIONS[currency]) {
    return CURRENCY_TRANSLATIONS[currency];
  }
  // Zkusit case-insensitive vyhledávání
  const normalized = currency.toLowerCase();
  for (const [key, value] of Object.entries(CURRENCY_TRANSLATIONS)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  
  // Automatický překlad na základě klíčových slov
  const lowerCurrency = currency.toLowerCase();
  
  // Mapování typů měn
  const currencyTypes: Record<string, string> = {
    dollar: "dolar",
    euro: "euro",
    pound: "libra",
    franc: "frank",
    yen: "jen",
    yuan: "jüan",
    rupee: "rupie",
    peso: "peso",
    real: "real",
    ruble: "rubl",
    lira: "lira",
    won: "won",
    baht: "baht",
    ringgit: "ringgit",
    dong: "dong",
    rupiah: "rupie",
    koruna: "koruna",
    krona: "koruna",
    krone: "koruna",
    forint: "forint",
    leu: "leu",
    lev: "lev",
    kuna: "kuna",
    zloty: "zlotý",
    złoty: "zlotý",
    dirham: "dirham",
    riyal: "rijál",
    rial: "rial",
    dinar: "dinár",
    shekel: "šekel",
    rand: "rand",
    sol: "sol",
    shilling: "šilink",
    birr: "birr",
    naira: "naira",
    cedi: "cedi",
    kwacha: "kwacha",
    pula: "pula",
    loti: "loti",
    lilangeni: "lilangeni",
    afghani: "afghání",
    taka: "taka",
    ngultrum: "ngultrum",
    kyat: "kyat",
    riel: "riel",
    kip: "kip",
    tugrik: "tugrik",
    tenge: "tenge",
    som: "som",
    somoni: "somoni",
    manat: "manat",
    dram: "dram",
    lari: "lari",
    hryvnia: "hřivna",
    lek: "lek",
    denar: "denar",
    mark: "marka",
    kina: "kina",
    vatu: "vatu",
    tala: "tala",
    paanga: "paʻanga",
    gourde: "gourde",
    lempira: "lempira",
    ouguiya: "ouguiya",
    cordoba: "córdoba",
    córdoba: "córdoba",
    guarani: "guaraní",
    guaraní: "guaraní",
    bolivar: "bolívar",
    bolívar: "bolívar",
    dalasi: "dalasi",
    leone: "leone",
    ariary: "ariary",
    metical: "metical",
    nakfa: "nakfa",
    dobra: "dobra",
    kwanza: "kwanza",
  };
  
  // Najít typ měny a zemi
  let currencyType = "";
  let countryName = "";
  
  for (const [type, translation] of Object.entries(currencyTypes)) {
    if (lowerCurrency.includes(type)) {
      currencyType = translation;
      // Odstranit typ měny z názvu, abychom získali název země
      countryName = lowerCurrency.replace(new RegExp(`\\s*${type}.*$`, "i"), "").trim();
      break;
    }
  }
  
  // Pokud jsme našli typ měny, zkusíme přeložit název země
  if (currencyType) {
    // Mapování názvů zemí do češtiny
    const countryTranslations: Record<string, string> = {
      "united states": "Americký",
      "american": "Americký",
      "singapore": "Singapurský",
      "british": "Britská",
      "japanese": "Japonský",
      "chinese": "Čínský",
      "australian": "Australský",
      "canadian": "Kanadský",
      "swiss": "Švýcarský",
      "swedish": "Švédská",
      "norwegian": "Norská",
      "danish": "Dánská",
      "polish": "Polský",
      "czech": "Česká",
      "hungarian": "Maďarský",
      "romanian": "Rumunský",
      "bulgarian": "Bulharský",
      "croatian": "Chorvatská",
      "turkish": "Turecká",
      "russian": "Ruský",
      "indian": "Indická",
      "thai": "Thajský",
      "south korean": "Jihokorejský",
      "indonesian": "Indonéská",
      "malaysian": "Malajsijský",
      "philippine": "Filipínské",
      "vietnamese": "Vietnamský",
      "brazilian": "Brazílský",
      "mexican": "Mexické",
      "argentine": "Argentinské",
      "chilean": "Chilské",
      "colombian": "Kolumbijské",
      "peruvian": "Peruánský",
      "south african": "Jihoafrický",
      "egyptian": "Egyptská",
      "israeli": "Izraelský",
      "saudi": "Saúdský",
      "qatari": "Katarský",
      "kuwaiti": "Kuvajtský",
      "bahraini": "Bahrajnský",
      "omani": "Ománský",
      "jordanian": "Jordánský",
      "lebanese": "Libanonská",
      "iraqi": "Irácký",
      "iranian": "Íránský",
      "pakistani": "Pákistánská",
      "bangladeshi": "Bangladéšská",
      "sri lankan": "Srílanská",
      "nepalese": "Nepálská",
      "myanmar": "Myanmarský",
      "cambodian": "Kambodžský",
      "laotian": "Laoský",
      "mongolian": "Mongolský",
      "kazakhstani": "Kazašský",
      "uzbekistani": "Uzbecký",
      "kyrgystani": "Kyrgyzský",
      "tajikistani": "Tádžický",
      "turkmenistani": "Turkmenistánský",
      "azerbaijani": "Ázerbájdžánský",
      "armenian": "Arménský",
      "georgian": "Gruzínský",
      "ukrainian": "Ukrajinská",
      "belarusian": "Běloruský",
      "moldovan": "Moldavský",
      "albanian": "Albánský",
      "macedonian": "Makedonský",
      "serbian": "Srbský",
      "montenegrin": "Euro",
      "icelandic": "Islandská",
      "moroccan": "Marocký",
      "algerian": "Alžírský",
      "tunisian": "Tuniský",
      "libyan": "Libyjský",
      "sudanese": "Súdánská",
      "ethiopian": "Etiopský",
      "kenyan": "Keňský",
      "tanzanian": "Tanzanský",
      "ugandan": "Ugandský",
      "rwandan": "Rwandský",
      "congolese": "Konžský",
      "nigerian": "Nigerijská",
      "ghanaian": "Ghanský",
      "gambian": "Gambijský",
      "guinean": "Guinejský",
      "sierra leonean": "Sierraleonský",
      "liberian": "Liberijský",
      "ivorian": "Pobřežně slonovinový",
      "burkina faso": "Burkinafasijský",
      "malian": "Malijský",
      "nigerien": "Nigerský",
      "chadian": "Čadský",
      "cameroonian": "Kamerunský",
      "equatorial guinean": "Rovníkovoguinejský",
      "gabonese": "Gabonský",
      "angolan": "Angolská",
      "zambian": "Zambijská",
      "malawian": "Malawijská",
      "botswana": "Botswanská",
      "namibian": "Namibijský",
      "lesotho": "Lesothský",
      "swazi": "Svazijský",
      "mauritian": "Mauricijská",
      "seychellois": "Seychelská",
      "comorian": "Komorský",
      "djiboutian": "Džibutský",
      "eritrean": "Eritrejská",
      "somali": "Somálský",
      "malagasy": "Madagaskarský",
      "mozambican": "Mosambický",
      "zimbabwean": "Zimbabwský",
      "afghan": "Afghánský",
      "bhutanese": "Bhútánský",
      "brunei": "Brunejský",
      "haitian": "Haitský",
      "honduran": "Honduraský",
      "jamaican": "Jamajský",
      "mauritanian": "Mauritánská",
      "nicaraguan": "Nikaragujský",
      "paraguayan": "Paraguayský",
      "surinamese": "Surinamský",
      "trinidad and tobago": "Trinidadsko-tobagský",
      "uruguayan": "Uruguayské",
      "venezuelan": "Venezuelský",
      "yemeni": "Jemenský",
      "new zealand": "Novozélandský",
      "fijian": "Fidžijský",
      "papua new guinean": "Papua-Novoguinejská",
      "solomon islands": "Šalamounský",
      "vanuatu": "Vanuatský",
      "samoan": "Samojský",
      "tongan": "Tonžská",
      "cook islands": "Cookův",
      "niue": "Niue",
      "pitcairn islands": "Pitcairnský",
      "tuvaluan": "Tuvaluský",
      "nauruan": "Nauruský",
      "palauan": "Palauský",
      "micronesian": "Mikronéský",
      "marshallese": "Marshallský",
      "kiribati": "Kiribatský",
      "east caribbean": "Východokaribský",
      "united arab emirates": "Spojených arabských emirátů",
    };
    
    // Zkusit najít překlad názvu země
    let translatedCountry = countryName;
    for (const [enName, csName] of Object.entries(countryTranslations)) {
      if (countryName.includes(enName)) {
        translatedCountry = csName;
        break;
      }
    }
    
    // Sestavit finální název
    if (translatedCountry && currencyType) {
      // Speciální případy
      if (currencyType === "libra" && translatedCountry.endsWith("á")) {
        return `${translatedCountry} ${currencyType}`;
      }
      if (currencyType === "koruna" && translatedCountry.endsWith("á")) {
        return `${translatedCountry} ${currencyType}`;
      }
      if (currencyType === "rupie" && translatedCountry.endsWith("á")) {
        return `${translatedCountry} ${currencyType}`;
      }
      if (currencyType === "peso" && translatedCountry.endsWith("é")) {
        return `${translatedCountry} ${currencyType}`;
      }
      if (currencyType === "marka") {
        return "Konvertibilní marka";
      }
      if (translatedCountry === "Euro") {
        return "Euro";
      }
      
      // Výchozí formát: [Přeložená země] [Typ měny]
      return `${translatedCountry} ${currencyType}`;
    }
  }
  
  // Pokud nenajdeme, vrátíme původní název
  return currency;
}

function translateCapital(capital: string): string {
  return CAPITAL_TRANSLATIONS[capital] || capital;
}

async function fetchCountryArticles(
  countryName: string,
  limit: number = 50
): Promise<Article[]> {
  try {
    const admin = createAdminSupabaseClient();
    
    // Načíst všechny schválené články
    const { data, error } = await admin
      .from("articles")
      .select(
        "id, title, status, created_at, updated_at, published_at, main_image_url, main_image_alt, slug, destination"
      )
      .eq("status", "approved")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(limit);
    
    if (error || !data) {
      return [];
    }
    
    // Filtrovat články podle názvu země
    const filtered = data.filter(
      (article: any) =>
        article.destination?.toLowerCase() === countryName.toLowerCase()
    );
    
    // Seřadit podle data publikace (nejnovější první)
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.published_at || a.created_at).getTime();
      const dateB = new Date(b.published_at || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return filtered.map((article: any) => ({
      id: article.id,
      title: article.title,
      main_image_url: article.main_image_url,
      main_image_alt: article.main_image_alt,
      slug: article.slug,
      published_at: article.published_at,
      created_at: article.created_at,
      destination: article.destination,
    }));
  } catch {
    return [];
  }
}

async function fetchCountryInfo(iso2?: string): Promise<CountryInfo> {
  if (!iso2) {
    return {};
  }

  try {
    // Použijeme REST Countries API pro získání informací o zemi
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${iso2.toLowerCase()}?fields=population,capital,languages,currencies,area`
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    // Přeložit jazyky
    const translatedLanguages: Record<string, string> = {};
    if (data.languages) {
      for (const [code, name] of Object.entries(data.languages)) {
        translatedLanguages[code] = translateLanguage(name as string);
      }
    }

    // Přeložit měny
    const translatedCurrencies: Record<
      string,
      { name: string; symbol: string }
    > = {};
    if (data.currencies) {
      for (const [code, currency] of Object.entries(
        data.currencies as Record<string, { name: string; symbol: string }>
      )) {
        translatedCurrencies[code] = {
          name: translateCurrency(currency.name),
          symbol: currency.symbol,
        };
      }
    }

    // Přeložit hlavní města
    const translatedCapitals =
      data.capital?.map((cap: string) => translateCapital(cap)) || [];

    return {
      population: data.population,
      capital: translatedCapitals,
      languages: translatedLanguages,
      currencies: translatedCurrencies,
      area: data.area,
    };
  } catch {
    return {};
  }
}

export default async function CountryGuide({
  name,
  iso2,
  continent,
  currentPath = "",
}: Props) {
  const [guide, stats, countryInfo, allArticles] = await Promise.all([
    fetchStoredGuide(iso2),
    fetchCountryStats(iso2),
    fetchCountryInfo(iso2),
    fetchCountryArticles(name, 50),
  ]);

  // Sidebar články (max 3)
  const sidebarArticles = allArticles.slice(0, 3);
  // Hlavní články (zbytek)
  const mainArticles = allArticles.slice(3);

  // Lead text z guide.intro
  const leadText = guide?.intro
    ? guide.intro.split(/[.!?]/).slice(0, 2).join(". ") + "."
    : `${name} je země v regionu ${continent}. Objevte tipy, zajímavosti a praktické informace pro vaši cestu.`;

  // Zkontrolovat, jestli je země navštívená (pomocí ISO2, stejně jako na mapě)
  const isVisited = iso2 ? await checkIfVisited(iso2) : false;
  
  console.log(`[CountryGuide] 📍 Country: ${name}, ISO2: ${iso2}, countryId: ${stats.countryId}, isVisited: ${isVisited}`);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {iso2 ? (
                <span
                  className={`fi fi-${iso2.toLowerCase()} drop-shadow-md`}
                  style={{ fontSize: 64 }}
                />
              ) : (
                <span className="text-6xl drop-shadow-md">🌍</span>
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  {name}
                </h1>
                <p className="text-lg text-gray-600">Region: {continent}</p>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
              {leadText}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:min-w-[200px]">
            {iso2 && (
              <VisitedButton
                iso2={iso2}
                initialVisited={isVisited}
                countryName={name}
                currentPath={currentPath}
              />
            )}
            <AddArticleButton countryName={name} currentPath={currentPath} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Levá strana - hlavní obsah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mapa země */}
          <Card className="rounded-xl border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FiMap className="w-5 h-5 text-emerald-600" />
                Poloha
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[400px]">
                <CountryMap iso2={iso2} countryName={name} />
              </div>
            </CardContent>
          </Card>

          {/* Průvodce - Wiki style */}
          {guide ? (
            <Card className="rounded-xl border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FiBookOpen className="w-6 h-6 text-emerald-600" />
                  Průvodce
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {guide.sections && guide.sections.length > 0 && (
                  <div className="space-y-6">
                    {guide.sections.map((section, index) => (
                      <div
                        key={section.id}
                        className={index > 0 ? "pt-6 border-t border-gray-200" : ""}
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {section.title}
                        </h3>
                        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                          {section.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FiBookOpen className="w-6 h-6 text-emerald-600" />
                  Průvodce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 leading-relaxed">
                  Průvodce pro {name} zatím nemáme. Zkuste to prosím později.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cestopisy a články - hlavní sekce */}
          {mainArticles.length > 0 && (
            <Card className="rounded-xl border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FiCamera className="w-6 h-6 text-emerald-600" />
                    Cestopisy a články
                  </CardTitle>
                  <Link
                    href={`/komunita?country=${encodeURIComponent(name)}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Zobrazit všechny →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mainArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/clanek/${article.slug}`}
                      className="block group"
                    >
                      <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
                        {article.main_image_url ? (
                          <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                            <Image
                              src={article.main_image_url}
                              alt={article.main_image_alt || article.title}
                              fill
                              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            <FiCamera className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold text-base text-gray-900 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <div className="text-xs text-gray-400 mt-auto">
                            {article.published_at
                              ? new Date(article.published_at).toLocaleDateString(
                                  "cs-CZ",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )
                              : new Date(article.created_at).toLocaleDateString(
                                  "cs-CZ",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pravá strana - sticky sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-6">
          {/* Wikipedia-like Infobox */}
          {(countryInfo.population ||
            countryInfo.capital ||
            countryInfo.languages ||
            countryInfo.currencies ||
            countryInfo.area) && (
            <Card className="rounded-xl border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3">
                <div className="flex items-center gap-3">
                  {iso2 && (
                    <span
                      className={`fi fi-${iso2.toLowerCase()}`}
                      style={{ fontSize: 32 }}
                    />
                  )}
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {countryInfo.capital && countryInfo.capital.length > 0 && (
                    <div className="px-4 py-3 flex">
                      <div className="text-sm text-gray-600 font-medium min-w-[120px]">
                        Hlavní město
                      </div>
                      <div className="text-sm text-gray-900 flex-1 font-semibold">
                        {countryInfo.capital.join(", ")}
                      </div>
                    </div>
                  )}
                  {countryInfo.languages &&
                    Object.keys(countryInfo.languages).length > 0 && (
                      <div className="px-4 py-3 flex">
                        <div className="text-sm text-gray-600 font-medium min-w-[120px]">
                          Úřední jazyk
                        </div>
                        <div className="text-sm text-gray-900 flex-1 font-semibold">
                          {Object.values(countryInfo.languages).join(", ")}
                        </div>
                      </div>
                    )}
                  {countryInfo.currencies &&
                    Object.keys(countryInfo.currencies).length > 0 && (
                      <div className="px-4 py-3 flex">
                        <div className="text-sm text-gray-600 font-medium min-w-[120px]">
                          Měna
                        </div>
                        <div className="text-sm text-gray-900 flex-1 font-semibold">
                          {Object.values(countryInfo.currencies)
                            .map((c) => `${c.name} (${c.symbol})`)
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  {countryInfo.population && (
                    <div className="px-4 py-3 flex">
                      <div className="text-sm text-gray-600 font-medium min-w-[120px]">
                        Počet obyvatel
                      </div>
                      <div className="text-sm text-gray-900 flex-1 font-semibold">
                        {countryInfo.population.toLocaleString("cs-CZ")}
                      </div>
                    </div>
                  )}
                  {countryInfo.area && (
                    <div className="px-4 py-3 flex">
                      <div className="text-sm text-gray-600 font-medium min-w-[120px]">
                        Rozloha
                      </div>
                      <div className="text-sm text-gray-900 flex-1 font-semibold">
                        {countryInfo.area.toLocaleString("cs-CZ")} km²
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistiky */}
          <Card className="rounded-xl border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <FiTrendingUp className="w-5 h-5 text-emerald-600" />
                Statistiky
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Navštívilo uživatelů</div>
                <div className="text-base font-semibold text-gray-900">
                  {stats.visitorsCount}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-sm text-gray-600">Článků</div>
                <div className="text-base font-semibold text-gray-900">
                  {stats.articlesCount}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cestopisy a články - sidebar (max 3) */}
          {sidebarArticles.length > 0 && (
            <Card className="rounded-xl border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FiCamera className="w-5 h-5 text-emerald-600" />
                  Cestopisy a články
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sidebarArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/clanek/${article.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        {article.main_image_url ? (
                          <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={article.main_image_url}
                              alt={article.main_image_alt || article.title}
                              fill
                              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="relative w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiCamera className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <div className="text-xs text-gray-400">
                            {article.published_at
                              ? new Date(article.published_at).toLocaleDateString(
                                  "cs-CZ",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : new Date(article.created_at).toLocaleDateString(
                                  "cs-CZ",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <Link
                      href={`/komunita?country=${encodeURIComponent(name)}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                    >
                      Zobrazit všechny →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
