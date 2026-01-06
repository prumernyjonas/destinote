"use client";

import { useState } from "react";
import Link from "next/link";

export default function CountryDetailPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Zpět na hlavní stránku
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Thajsko</h1>
                <p className="text-sm text-gray-600">Jihovýchodní Asie</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Označit jako navštívené
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-medium">JN</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Jan Novák
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Country Hero */}
      <section className="bg-gradient-to-r from-blue-500 to-green-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🇹🇭</div>
            <h2 className="text-4xl font-bold mb-4">Thajsko</h2>
            <p className="text-xl opacity-90 mb-6">
              Země úsměvů, nádherných pláží a bohaté kultury
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold">67M</div>
                <div className="opacity-80">obyvatel</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">513,120</div>
                <div className="opacity-80">km²</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Bangkok</div>
                <div className="opacity-80">hlavní město</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Přehled
            </button>
            <button
              onClick={() => setActiveTab("tips")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tips"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cestovní tipy
            </button>
            <button
              onClick={() => setActiveTab("flights")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "flights"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nabídky letenek
            </button>
            <button
              onClick={() => setActiveTab("articles")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "articles"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Články uživatelů
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    O Thajsku
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Thajsko je království v jihovýchodní Asii, známé svými
                    nádhernými plážemi, bohatou historií a vynikající kuchyní.
                    Země nabízí jedinečnou kombinaci moderních měst a tradičních
                    vesnic, tropických ostrovů a horských oblastí.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Hlavní města
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Bangkok - hlavní město</li>
                        <li>• Chiang Mai - severní kultura</li>
                        <li>• Phuket - plážové destinace</li>
                        <li>• Pattaya - turistické centrum</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Nejlepší období
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Listopad - únor: suché období</li>
                        <li>• Březen - květen: horké období</li>
                        <li>• Červen - říjen: monzunové období</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Zajímavá místa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Wat Pho, Bangkok
                      </h4>
                      <p className="text-sm text-gray-600">
                        Slavný chrám s obrovskou sochou ležícího Buddhy
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Phi Phi Islands
                      </h4>
                      <p className="text-sm text-gray-600">
                        Nádherné ostrovy s křišťálově čistou vodou
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Chiang Rai
                      </h4>
                      <p className="text-sm text-gray-600">
                        Bílý chrám a zlatý trojúhelník
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Ayutthaya
                      </h4>
                      <p className="text-sm text-gray-600">
                        Historické ruiny bývalého hlavního města
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tips" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Cestovní tipy
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900">Doprava</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Používejte tuk-tuky pro krátké vzdálenosti, songthaew
                        pro delší cesty. V Bangkoku je metro a BTS velmi
                        efektivní.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">Jídlo</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Vyzkoušejte street food - je bezpečný a chutný. Pad
                        Thai, Tom Yum Goong a mango sticky rice jsou must-try
                        pokrmy.
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-medium text-gray-900">Kultura</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Respektujte buddhistické chrámy - noste dlouhé kalhoty a
                        zakrytá ramena. Nikdy neukazujte na sochy Buddhy nohama.
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-medium text-gray-900">Bezpečnost</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Thajsko je obecně bezpečná země, ale pozor na kapsáře v
                        turistických oblastech. Vždy mějte kopie důležitých
                        dokumentů.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "flights" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Aktuální nabídky letenek
                  </h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Praha → Bangkok
                          </h4>
                          <p className="text-sm text-gray-600">
                            Thai Airways • 1 přestup
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            18,990 Kč
                          </div>
                          <div className="text-xs text-gray-500">za osobu</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Odlet:</span> 15. dubna
                        2024, 14:30
                        <br />
                        <span className="font-medium">Přílet:</span> 16. dubna
                        2024, 08:45
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Praha → Phuket
                          </h4>
                          <p className="text-sm text-gray-600">
                            Emirates • 1 přestup
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            22,500 Kč
                          </div>
                          <div className="text-xs text-gray-500">za osobu</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Odlet:</span> 20. dubna
                        2024, 16:20
                        <br />
                        <span className="font-medium">Přílet:</span> 21. dubna
                        2024, 12:15
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Praha → Chiang Mai
                          </h4>
                          <p className="text-sm text-gray-600">
                            Qatar Airways • 1 přestup
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            19,750 Kč
                          </div>
                          <div className="text-xs text-gray-500">za osobu</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Odlet:</span> 25. dubna
                        2024, 11:45
                        <br />
                        <span className="font-medium">Přílet:</span> 26. dubna
                        2024, 06:30
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
                      Zobrazit více nabídek
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "articles" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Články o Thajsku
                  </h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">MK</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Marie Kovářová
                          </div>
                          <div className="text-xs text-gray-500">
                            před 3 dny
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Skryté pláže Thajska
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Objevte nejkrásnější pláže, které nejsou v průvodcích.
                        Od vzdálených ostrovů po klidné zátoky...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👍 12</span>
                        <span>💬 3</span>
                        <span>🔖 Uložit</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">TN</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Tomáš Novák
                          </div>
                          <div className="text-xs text-gray-500">
                            před 1 týdnem
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Thajská kuchyně pro začátečníky
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Kompletní průvodce thajskými pokrmy. Co ochutnat, kde
                        jíst a jak se vyhnout příliš ostrým jídlům...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>👍 8</span>
                        <span>💬 5</span>
                        <span>🔖 Uložit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Rychlé informace
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Měna:</span>
                  <span className="font-medium">THB (Baht)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jazyk:</span>
                  <span className="font-medium">Thajština</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Časové pásmo:</span>
                  <span className="font-medium">UTC+7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Víza:</span>
                  <span className="font-medium">30 dní zdarma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Elektřina:</span>
                  <span className="font-medium">220V</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Statistiky
              </h3>

              <div className="space-y-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">1,247</div>
                  <div className="text-sm text-gray-600">
                    navštívilo uživatelů
                  </div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-sm text-gray-600">článků</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4.8</div>
                  <div className="text-sm text-gray-600">hodnocení</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Podobné země
              </h3>

              <div className="space-y-2">
                <Link
                  href="/country/vietnam"
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-lg">🇻🇳</span>
                  <span className="text-sm font-medium text-gray-900">
                    Vietnam
                  </span>
                </Link>

                <Link
                  href="/country/cambodia"
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-lg">🇰🇭</span>
                  <span className="text-sm font-medium text-gray-900">
                    Kambodža
                  </span>
                </Link>

                <Link
                  href="/country/laos"
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-lg">🇱🇦</span>
                  <span className="text-sm font-medium text-gray-900">
                    Laos
                  </span>
                </Link>

                <Link
                  href="/country/malaysia"
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-lg">🇲🇾</span>
                  <span className="text-sm font-medium text-gray-900">
                    Malajsie
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
