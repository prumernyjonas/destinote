"use client";

import Link from "next/link";
import PublicWorldMap from "@/components/PublicWorldMap";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* World Map Section */}
      <section className="px-6 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Interaktivní mapa světa
              </h2>
              <p className="text-gray-600">
                Klikněte na zemi a objevte nejlepší destinace
              </p>
            </div>
            <div className="rounded-lg overflow-hidden">
              <PublicWorldMap />
            </div>
          </div>
        </div>
      </section>

      {/* Countries by Continent */}
      <section className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Oblíbené destinace podle kontinentů
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Afrika */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-200 rounded mr-3 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Afrika</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>Maroko</li>
                <li>Tanzánie</li>
                <li>Keňa</li>
                <li>Madagaskar</li>
                <li>Libye</li>
              </ul>
              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center">
                Další země <span className="ml-2">→</span>
              </button>
            </div>

            {/* Amerika */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-200 rounded mr-3 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🌎</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Amerika</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>USA</li>
                <li>Kuba</li>
                <li>Peru</li>
                <li>Kanada</li>
                <li>Brazílie</li>
              </ul>
              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center">
                Další země <span className="ml-2">→</span>
              </button>
            </div>

            {/* Asie */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-200 rounded mr-3 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🌏</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Asie</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>Thajsko</li>
                <li>Indie</li>
                <li>Sri Lanka</li>
                <li>Vietnam</li>
                <li>Indonésie</li>
              </ul>
              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center">
                Další země <span className="ml-2">→</span>
              </button>
            </div>

            {/* Austrálie */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-200 rounded mr-3 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🌏</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Austrálie</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>Austrálie</li>
                <li>Nový Zéland</li>
                <li>Papua Nová Guinea</li>
                <li>Francouzská Polynésie</li>
                <li>Tuvalu</li>
              </ul>
              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center">
                Další země <span className="ml-2">→</span>
              </button>
            </div>

            {/* Evropa */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-200 rounded mr-3 flex items-center justify-center">
                  <span className="text-green-600 text-sm">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Evropa</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li>Polsko</li>
                <li>Švýcarsko</li>
                <li>Rakousko</li>
                <li>Itálie</li>
                <li>Chorvatsko</li>
              </ul>
              <button className="mt-4 w-full bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 transition-colors flex items-center justify-center">
                Další země <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Proč si vybrat Destinote?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sledujte své cesty
              </h3>
              <p className="text-gray-600">
                Interaktivní mapa vašich navštívených destinací
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sdílejte zážitky
              </h3>
              <p className="text-gray-600">
                Pište články a sdílejte fotografie z cest
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Získejte odznaky
              </h3>
              <p className="text-gray-600">
                Gamifikace s odznaky a levely za cestování
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Sledujte přátele
              </h3>
              <p className="text-gray-600">
                Sledujte ostatní cestovatele a jejich příběhy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Začněte svou cestovatelskou cestu
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Připojte se k komunitě cestovatelů a začněte sledovat své
            dobrodružství
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Zaregistrovat se
            </Link>
            <Link
              href="/auth/login"
              className="bg-white hover:bg-gray-50 text-green-600 px-8 py-3 rounded-lg font-medium border border-green-600 transition-colors"
            >
              Přihlásit se
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
