"use client";

import Link from "next/link";

export default function PodminkyPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#cbe1f7] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Podmínky použití
          </h1>
          <p className="text-gray-600 mb-8">
            Poslední aktualizace: {new Date().toLocaleDateString("cs-CZ")}
          </p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Úvodní ustanovení
              </h2>
              <p>
                Tyto podmínky použití (dále jen "Podmínky") upravují používání
                webové aplikace Destinote (dále jen "Služba" nebo "Aplikace"),
                která je provozována a spravována provozovatelem (dále jen
                "Provozovatel").
              </p>
              <p>
                Používáním této Služby vyjadřujete souhlas s těmito Podmínkami.
                Pokud s těmito Podmínkami nesouhlasíte, nepoužívejte tuto
                Službu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Definice pojmů
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Uživatel</strong> - fyzická nebo právnická osoba,
                  která používá Službu
                </li>
                <li>
                  <strong>Účet</strong> - uživatelský účet vytvořený v rámci
                  Služby
                </li>
                <li>
                  <strong>Obsah</strong> - veškeré texty, obrázky, videa a další
                  materiály zveřejněné v rámci Služby
                </li>
                <li>
                  <strong>Uživatelský obsah</strong> - obsah vytvořený a
                  zveřejněný uživatelem
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Registrace a uživatelský účet
              </h2>
              <p>
                Pro plné využití Služby je nutná registrace a vytvoření
                uživatelského účtu. Při registraci se zavazujete:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>poskytnout pravdivé, přesné a aktuální informace o sobě</li>
                <li>
                  udržovat a aktualizovat registrační údaje tak, aby zůstaly
                  pravdivé, přesné a aktuální
                </li>
                <li>zachovávat důvěrnost svého hesla a přihlašovacích údajů</li>
                <li>
                  nést plnou odpovědnost za všechny aktivity, které se uskuteční
                  pod vaším účtem
                </li>
                <li>
                  okamžitě informovat Provozovatele o jakémkoli neoprávněném
                  použití vašeho účtu
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Pravidla používání Služby
              </h2>
              <p>Při používání Služby se zavazujete:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  nepoužívat Službu k nezákonným účelům nebo způsobem, který
                  porušuje práva třetích stran
                </li>
                <li>
                  nezveřejňovat obsah, který je nezákonný, urážlivý,
                  diskriminační, pomlouvačný, vulgární, obscénní nebo jinak
                  nevhodný
                </li>
                <li>
                  neporušovat autorská práva, ochranné známky nebo jiná práva
                  duševního vlastnictví
                </li>
                <li>nešířit malware, viry nebo jiný škodlivý software</li>
                <li>
                  neprovádět pokusy o neoprávněný přístup k systému nebo datům
                </li>
                <li>
                  neprovádět automatizované sbírání dat (scraping) bez
                  předchozího písemného souhlasu Provozovatele
                </li>
                <li>respektovat práva a důstojnost ostatních uživatelů</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Uživatelský obsah
              </h2>
              <p>
                Uživatel si zachovává všechna práva k obsahu, který vytvoří a
                zveřejní v rámci Služby. Zveřejněním obsahu však udělujete
                Provozovateli a ostatním uživatelům Služby nevýhradní,
                celosvětovou, bezplatnou licenci k použití, zobrazení,
                distribuci a zveřejnění tohoto obsahu v rámci Služby.
              </p>
              <p>
                Provozovatel si vyhrazuje právo odstranit nebo upravit jakýkoli
                obsah, který porušuje tyto Podmínky nebo je jinak nevhodný, bez
                předchozího upozornění.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Duševní vlastnictví
              </h2>
              <p>
                Veškerý obsah Služby, včetně textů, grafiky, log, ikon, obrázků,
                audio a video nahrávek, softwaru a jejich uspořádání, je
                vlastnictvím Provozovatele nebo jeho poskytovatelů obsahu a je
                chráněn autorským právem a dalšími zákony o duševním
                vlastnictví.
              </p>
              <p>
                Uživatel nesmí kopírovat, reprodukovat, distribuovat, vytvářet
                odvozená díla nebo jinak využívat obsah Služby bez předchozího
                písemného souhlasu Provozovatele, kromě případů výslovně
                povolených těmito Podmínkami.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Odpovědnost a záruky
              </h2>
              <p>
                Služba je poskytována "tak, jak je" bez jakýchkoli záruk,
                výslovných nebo předpokládaných. Provozovatel nezaručuje, že:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Služba bude fungovat nepřetržitě, bez chyb nebo bezpečnostních
                  problémů
                </li>
                <li>jakékoli chyby budou opraveny</li>
                <li>Služba bude bez virů nebo jiných škodlivých komponent</li>
              </ul>
              <p>
                Provozovatel nenese odpovědnost za jakékoli přímé, nepřímé,
                náhodné, zvláštní nebo následné škody vzniklé v souvislosti s
                používáním nebo neschopností používat Službu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Ukončení účtu
              </h2>
              <p>
                Provozovatel si vyhrazuje právo ukončit nebo pozastavit váš účet
                a přístup ke Službě okamžitě, bez předchozího upozornění, z
                jakéhokoli důvodu, včetně porušení těchto Podmínek.
              </p>
              <p>
                Uživatel může svůj účet kdykoli zrušit prostřednictvím nastavení
                účtu nebo kontaktováním Provozovatele.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Změny Podmínek
              </h2>
              <p>
                Provozovatel si vyhrazuje právo tyto Podmínky kdykoli změnit. O
                změnách budou uživatelé informováni prostřednictvím Služby nebo
                e-mailem. Pokračováním v používání Služby po změně Podmínek
                vyjadřujete souhlas s novými Podmínkami.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Závěrečná ustanovení
              </h2>
              <p>
                Tyto Podmínky se řídí právním řádem České republiky. Všechny
                spory vzniklé z těchto Podmínek nebo v souvislosti s nimi budou
                řešeny příslušnými soudy České republiky.
              </p>
              <p>
                Pokud bude některé ustanovení těchto Podmínek shledáno neplatným
                nebo nevynutitelným, zbývající ustanovení zůstanou v plné
                platnosti a účinnosti.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Kontakt
              </h2>
              <p>
                V případě dotazů ohledně těchto Podmínek nás můžete kontaktovat
                na e-mailové adrese:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong>{" "}
                <a
                  href="mailto:jonas.sury@seznam.cz"
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  jonas.sury@seznam.cz
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              ← Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
