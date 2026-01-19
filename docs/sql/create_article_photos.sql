-- Vytvoření tabulky article_photos pro ukládání více fotek ke článkům
-- Tato tabulka umožňuje ukládat neomezený počet fotek pro každý článek

CREATE TABLE IF NOT EXISTS public.article_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  width INTEGER,
  height INTEGER,
  public_id TEXT, -- Cloudinary public_id (volitelné, pro případné mazání z Cloudinary)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_article_photos_article_id ON public.article_photos(article_id);
CREATE INDEX IF NOT EXISTS idx_article_photos_author_id ON public.article_photos(author_id);
CREATE INDEX IF NOT EXISTS idx_article_photos_created_at ON public.article_photos(created_at);

-- Trigger pro automatické nastavení updated_at
CREATE OR REPLACE FUNCTION update_article_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_photos_updated_at
  BEFORE UPDATE ON public.article_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_article_photos_updated_at();

-- RLS (Row Level Security) politiky
ALTER TABLE public.article_photos ENABLE ROW LEVEL SECURITY;

-- Uživatelé mohou vidět všechny fotky (schválené články jsou veřejné)
CREATE POLICY "Anyone can view article photos"
  ON public.article_photos
  FOR SELECT
  USING (true);

-- Uživatelé mohou přidávat fotky ke svým vlastním článkům
CREATE POLICY "Users can insert photos to their own articles"
  ON public.article_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE id = article_id AND author_id = auth.uid()
    )
  );

-- Uživatelé mohou upravovat fotky ve svých vlastních článcích
CREATE POLICY "Users can update photos in their own articles"
  ON public.article_photos
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Uživatelé mohou mazat fotky ze svých vlastních článků
CREATE POLICY "Users can delete photos from their own articles"
  ON public.article_photos
  FOR DELETE
  USING (auth.uid() = author_id);

-- Admini a moderátoři mají plný přístup
CREATE POLICY "Admins and moderators have full access to article photos"
  ON public.article_photos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
