-- Migrace pro notifikace (0004) – přizpůsobení existující tabulce
-- Tabulka notifications už existuje s: recipient_id, type, article_id, actor_id, payload, is_read
-- Tento skript přidá chybějící enum hodnoty a RLS politiky.

-- 1. Přidat enum hodnoty pro typ notifikace (pokud enum existuje)
-- Zkontrolujte název enumu v databázi – může být např. notification_type
-- Pokud INSERT do notifications selhává na type, spusťte např.:
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_approved';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_rejected';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_submitted';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'article_like';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_new';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_like';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_follower';

-- 2. Indexy pro rychlé dotazy (pokud neexistují)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id
  ON public.notifications (recipient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, is_read)
  WHERE is_read = false;

-- 3. RLS politiky (pro recipient_id)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Odebrat staré politiky pokud používaly user_id
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- SELECT: uživatel vidí pouze své notifikace
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = recipient_id);

-- UPDATE: uživatel může označit pouze své notifikace jako přečtené
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
