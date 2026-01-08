"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

type AdminArticle = {
  id: string;
  author_id: string;
  title: string;
  status: string;
  created_at: string;
  published_at?: string | null;
  main_image_url?: string | null;
};

export default function AdminArticlesPage() {
  const [pendingItems, setPendingItems] = useState<AdminArticle[]>([]);
  const [approvedItems, setApprovedItems] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const [resPending, resApproved] = await Promise.all([
        fetch(`/api/admin/articles?status=pending`, { headers }),
        fetch(`/api/admin/articles?status=approved`, { headers }),
      ]);
      if (!resPending.ok) {
        const d = await resPending.json().catch(() => ({}));
        throw new Error(d.error || "Chyba načítání čekajících článků");
      }
      if (!resApproved.ok) {
        const d = await resApproved.json().catch(() => ({}));
        throw new Error(d.error || "Chyba načítání schválených článků");
      }
      const [dPending, dApproved] = await Promise.all([
        resPending.json(),
        resApproved.json(),
      ]);
      setPendingItems(dPending.items || []);
      setApprovedItems(dApproved.items || []);
    } catch (e: any) {
      setError(e.message || "Chyba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approve(id: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/admin/articles/${id}/approve`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Chyba při schvalování článku");
      }

      await loadAll();
    } catch (e: any) {
      setError(e.message || "Chyba při schvalování");
    }
  }

  async function reject(id: string) {
    try {
      const reason = prompt("Důvod zamítnutí (volitelné):") || "";
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/admin/articles/${id}/reject`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Chyba při zamítání článku");
      }

      await loadAll();
    } catch (e: any) {
      setError(e.message || "Chyba při zamítání");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Moderace článků</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Načítám…</div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Čekající ke schválení</h2>
            {pendingItems.length === 0 ? (
              <p>Žádné články ke schválení.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 border-b">Název</th>
                      <th className="text-left px-4 py-2 border-b">Autor</th>
                      <th className="text-left px-4 py-2 border-b">Vytvořeno</th>
                      <th className="text-left px-4 py-2 border-b">Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b">{a.title}</td>
                        <td className="px-4 py-2 border-b text-gray-700">{a.author_id}</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          {new Date(a.created_at).toLocaleDateString("cs-CZ")}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => reject(a.id)}>
                              Zamítnout
                            </Button>
                            <Button onClick={() => approve(a.id)}>Schválit</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Schválené články</h2>
            {approvedItems.length === 0 ? (
              <p>Žádné schválené články.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 border-b">Název</th>
                      <th className="text-left px-4 py-2 border-b">Autor</th>
                      <th className="text-left px-4 py-2 border-b">Publikováno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedItems.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b">{a.title}</td>
                        <td className="px-4 py-2 border-b text-gray-700">{a.author_id}</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          {new Date(a.published_at || a.created_at).toLocaleDateString("cs-CZ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}


