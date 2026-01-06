// src/components/guides/CountryGuide.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  name: string;
  iso2?: string;
  continent: string;
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

export default async function CountryGuide({ name, iso2, continent }: Props) {
  const guide = await fetchStoredGuide(iso2);

  if (!guide) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Průvodce</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800">
            Průvodce pro {name} zatím nemáme. Zkuste to prosím později.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Průvodce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="font-semibold text-gray-900">Úvod</div>
            <p className="text-gray-800 whitespace-pre-line">{guide.intro}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guide.sections?.map((section) => (
              <Card key={section.id} className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 whitespace-pre-line">
                    {section.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
