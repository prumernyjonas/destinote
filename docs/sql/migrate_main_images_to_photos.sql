-- Migrace existujících hlavních obrázků do tabulky article_photos
-- Tento skript vezme všechny hlavní obrázky z tabulky articles a přidá je do article_photos
-- Hlavní obrázek zůstane v articles (pro náhledy), ale bude také v article_photos (pro zobrazení na stránce článku)

INSERT INTO public.article_photos (
  article_id,
  author_id,
  url,
  alt,
  width,
  height,
  public_id,
  created_at,
  updated_at
)
SELECT 
  a.id as article_id,
  a.author_id,
  a.main_image_url as url,
  a.main_image_alt as alt,
  a.main_image_width as width,
  a.main_image_height as height,
  a.main_image_public_id as public_id,
  a.created_at,
  a.updated_at
FROM public.articles a
WHERE 
  a.main_image_url IS NOT NULL
  AND a.main_image_url != ''
  -- Zkontrolovat, zda už tento obrázek není v article_photos (aby se nepřidávaly duplicity)
  AND NOT EXISTS (
    SELECT 1 
    FROM public.article_photos ap 
    WHERE ap.article_id = a.id 
      AND ap.url = a.main_image_url
  )
ON CONFLICT DO NOTHING;

-- Po migraci můžete zkontrolovat výsledek:
-- SELECT a.id, a.title, a.main_image_url, COUNT(ap.id) as photo_count
-- FROM articles a
-- LEFT JOIN article_photos ap ON ap.article_id = a.id
-- WHERE a.main_image_url IS NOT NULL
-- GROUP BY a.id, a.title, a.main_image_url
-- ORDER BY a.created_at DESC;
