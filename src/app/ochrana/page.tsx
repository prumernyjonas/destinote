"use client";

import Link from "next/link";

export default function OchranaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#cbe1f7] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Zásady ochrany osobních údajů
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
                Tento dokument popisuje, jak webová aplikace Destinote (dále jen
                "Služba" nebo "Aplikace") shromažďuje, používá a chrání vaše
                osobní údaje v souladu s Nařízením Evropského parlamentu a Rady
                (EU) 2016/679 ze dne 27. dubna 2016 o ochraně fyzických osob v
                souvislosti se zpracováním osobních údajů a o volném pohybu
                těchto údajů (GDPR).
              </p>
              <p>
                Správcem osobních údajů je provozovatel Služby (dále jen
                "Správce").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Jaké osobní údaje zpracováváme
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2.1 Údaje poskytnuté při registraci
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>E-mailová adresa</li>
                <li>Přezdívka (nickname)</li>
                <li>Heslo (v zašifrované podobě)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2.2 Údaje poskytnuté při používání Služby
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Profilová fotografie (volitelně)</li>
                <li>Obsah článků a příspěvků</li>
                <li>Komentáře a interakce s ostatními uživateli</li>
                <li>Informace o navštívených zemích</li>
                <li>Preference a nastavení účtu</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                2.3 Automaticky shromažďované údaje
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP adresa</li>
                <li>Typ prohlížeče a operačního systému</li>
                <li>Čas a datum přístupu</li>
                <li>Stránky, které navštívíte v rámci Služby</li>
                <li>Cookies a podobné technologie</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Účel zpracování osobních údajů
              </h2>
              <p>Vaše osobní údaje zpracováváme za následujícími účely:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Poskytování Služby</strong> - vytvoření a správa
                  vašeho uživatelského účtu, umožnění přístupu k funkcím Služby
                </li>
                <li>
                  <strong>Komunikace</strong> - zasílání důležitých oznámení
                  týkajících se Služby, odpovědi na vaše dotazy
                </li>
                <li>
                  <strong>Zlepšování Služby</strong> - analýza používání Služby
                  za účelem zlepšení funkcionality a uživatelského zážitku
                </li>
                <li>
                  <strong>Bezpečnost</strong> - prevence podvodů, zneužití a
                  dalších nezákonných aktivit
                </li>
                <li>
                  <strong>Placení právních povinností</strong> - plnění
                  zákonných povinností Správce
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Právní základ zpracování
              </h2>
              <p>Osobní údaje zpracováváme na základě:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Souhlasu subjektu údajů</strong> - při registraci
                  udělujete souhlas se zpracováním osobních údajů
                </li>
                <li>
                  <strong>Placení smlouvy</strong> - zpracování je nutné pro
                  poskytování Služby, se kterou jste souhlasili
                </li>
                <li>
                  <strong>Oprávněného zájmu Správce</strong> - zlepšování
                  Služby, bezpečnost, prevence podvodů
                </li>
                <li>
                  <strong>Placení právní povinnosti</strong> - plnění zákonných
                  povinností Správce
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Doba uchovávání osobních údajů
              </h2>
              <p>
                Osobní údaje uchováváme pouze po dobu nezbytnou pro naplnění
                účelů, pro které byly shromážděny, nebo po dobu stanovenou
                zákonem.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Údaje z uživatelského účtu - po dobu existence účtu a 30 dní
                  po jeho zrušení
                </li>
                <li>
                  Údaje potřebné pro plnění právních povinností - po dobu
                  stanovenou zákonem
                </li>
                <li>
                  Cookies a podobné technologie - podle nastavení vašeho
                  prohlížeče, maximálně 13 měsíců
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Předávání osobních údajů třetím stranám
              </h2>
              <p>
                Vaše osobní údaje můžeme předat následujícím kategoriím
                příjemců:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Poskytovatelé služeb</strong> - společnosti, které nám
                  pomáhají poskytovat Službu (hosting, e-mailové služby,
                  analytické nástroje)
                </li>
                <li>
                  <strong>Právní zástupci a úřady</strong> - v případě, že to
                  vyžaduje zákon nebo na základě soudního rozhodnutí
                </li>
              </ul>
              <p>
                Všichni příjemci jsou povinni dodržovat stejné standardy ochrany
                osobních údajů jako my a používat údaje pouze pro účely, pro
                které byly předány.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Předávání údajů do třetích zemí
              </h2>
              <p>
                Některé z našich poskytovatelů služeb mohou být umístěni mimo
                Evropský hospodářský prostor (EHP). V takových případech
                zajišťujeme, že předávání údajů probíhá v souladu s GDPR a
                používáme vhodné záruky, jako jsou standardní smluvní doložky
                schválené Evropskou komisí.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Vaše práva
              </h2>
              <p>V souladu s GDPR máte následující práva:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Právo na přístup</strong> - právo získat informace o
                  tom, jaké osobní údaje o vás zpracováváme
                </li>
                <li>
                  <strong>Právo na opravu</strong> - právo požádat o opravu
                  nepřesných nebo neúplných osobních údajů
                </li>
                <li>
                  <strong>Právo na výmaz</strong> - právo požádat o smazání
                  vašich osobních údajů ("právo být zapomenut")
                </li>
                <li>
                  <strong>Právo na omezení zpracování</strong> - právo požádat
                  o omezení zpracování vašich osobních údajů
                </li>
                <li>
                  <strong>Právo na přenositelnost údajů</strong> - právo získat
                  vaše osobní údaje ve strukturovaném, běžně používaném a
                  strojově čitelném formátu
                </li>
                <li>
                  <strong>Právo vznést námitku</strong> - právo vznést námitku
                  proti zpracování vašich osobních údajů
                </li>
                <li>
                  <strong>Právo odvolat souhlas</strong> - právo kdykoli odvolat
                  souhlas se zpracováním osobních údajů
                </li>
                <li>
                  <strong>Právo podat stížnost</strong> - právo podat stížnost
                  u dozorového úřadu (Úřad pro ochranu osobních údajů)
                </li>
              </ul>
              <p>
                Pro uplatnění svých práv nás můžete kontaktovat prostřednictvím
                kontaktních údajů uvedených níže.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Cookies a podobné technologie
              </h2>
              <p>
                Služba používá cookies a podobné technologie pro zlepšení
                uživatelského zážitku, analýzu používání Služby a personalizaci
                obsahu.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                Typy cookies, které používáme:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Nezbytné cookies</strong> - nutné pro fungování
                  Služby, nelze je vypnout
                </li>
                <li>
                  <strong>Funkční cookies</strong> - umožňují zapamatovat si
                  vaše preference
                </li>
                <li>
                  <strong>Analytické cookies</strong> - pomáhají nám pochopit,
                  jak návštěvníci používají Službu
                </li>
              </ul>
              <p>
                Cookies můžete spravovat prostřednictvím nastavení vašeho
                prohlížeče. Všimněte si, že vypnutí některých cookies může
                ovlivnit funkčnost Služby.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Zabezpečení osobních údajů
              </h2>
              <p>
                Pro ochranu vašich osobních údajů používáme vhodná technická a
                organizační opatření, včetně:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Šifrování dat při přenosu (HTTPS)</li>
                <li>Šifrování hesel</li>
                <li>Pravidelné bezpečnostní audity</li>
                <li>Omezený přístup k osobním údajům pouze pro oprávněné osoby</li>
                <li>Pravidelné zálohování dat</li>
              </ul>
              <p>
                I přes tato opatření nemůžeme zaručit absolutní bezpečnost
                údajů. V případě bezpečnostního incidentu vás budeme informovat
                v souladu s právními předpisy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Změny těchto Zásad
              </h2>
              <p>
                Tyto Zásady můžeme čas od času aktualizovat. O významných
                změnách vás budeme informovat prostřednictvím Služby nebo
                e-mailem. Doporučujeme pravidelně kontrolovat tuto stránku pro
                aktuální informace o ochraně osobních údajů.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                12. Kontakt
              </h2>
              <p>
                Pokud máte jakékoli dotazy ohledně zpracování vašich osobních
                údajů nebo chcete uplatnit svá práva, můžete nás kontaktovat:
              </p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <li>
                  <strong>E-mail:</strong>{" "}
                  <a
                    href="mailto:jonas.sury@seznam.cz"
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    jonas.sury@seznam.cz
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                13. Dozorový úřad
              </h2>
              <p>
                Máte právo podat stížnost u dozorového úřadu, pokud se domníváte,
                že zpracování vašich osobních údajů porušuje GDPR.
              </p>
              <p>
                <strong>Úřad pro ochranu osobních údajů</strong>
                <br />
                Pplk. Sochora 27
                <br />
                170 00 Praha 7
                <br />
                Česká republika
                <br />
                E-mail: posta@uoou.cz
                <br />
                Web: www.uoou.cz
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
