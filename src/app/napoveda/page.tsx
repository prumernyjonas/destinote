export default function NapovedaPage() {
  const steps = [
    {
      title: "Přidání nového článku",
      items: [
        "Otevři Dashboard → Nový článek.",
        "Vyplň název, slug a krátký úvod.",
        "Nahraj titulní fotku (ideálně 16:9).",
        "Napiš obsah a ulož návrh nebo rovnou publikuj.",
      ],
    },
    {
      title: "Úprava existujícího článku",
      items: [
        "Dashboard → Články.",
        "Vyber článek a klikni na Upravit.",
        "Uprav texty, fotky nebo tagy a změny ulož.",
      ],
    },
    {
      title: "Moderování komentářů",
      items: [
        "Dashboard → Komentáře.",
        "Schvaluj, zamítej nebo reaguj na nové příspěvky.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
            Nápověda
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Jak pracovat s Destinote
          </h1>
          <p className="text-slate-600">
            Rychlé kroky, jak přidat článek, upravit obsah nebo moderovat
            komentáře.
          </p>
        </header>

        <section className="grid gap-4">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {step.title}
              </h2>
              <ul className="mt-4 space-y-2 text-slate-700 list-disc list-inside">
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Potřebuješ poradit?
          </h3>
          <p className="mt-2 text-slate-700">
            Pokud něco nefunguje nebo si nejsi jistý postupem, napiš nám v
            komunitě nebo na podporu a rádi pomůžeme.
          </p>
        </section>
      </div>
    </main>
  );
}

