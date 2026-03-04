-- Lajky a dislajky u komentářů (pro UI: palec nahoru / palec dolů + počty)
-- Spusťte v Supabase SQL Editoru.

-- 1) comment_likes (pokud ještě neexistuje)
CREATE TABLE IF NOT EXISTS public.comment_likes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- 2) comment_dislikes
CREATE TABLE IF NOT EXISTS public.comment_dislikes (
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comment_dislikes_pkey PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_dislikes_comment_id ON public.comment_dislikes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_dislikes_user_id ON public.comment_dislikes(user_id);

-- RLS (volitelné – pro přímý přístup z klienta; API používá service role)
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comment_likes" ON public.comment_likes;
CREATE POLICY "Anyone can read comment_likes" ON public.comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own comment_likes" ON public.comment_likes;
CREATE POLICY "Users can insert own comment_likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comment_likes" ON public.comment_likes;
CREATE POLICY "Users can delete own comment_likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read comment_dislikes" ON public.comment_dislikes;
CREATE POLICY "Anyone can read comment_dislikes" ON public.comment_dislikes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own comment_dislikes" ON public.comment_dislikes;
CREATE POLICY "Users can insert own comment_dislikes" ON public.comment_dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comment_dislikes" ON public.comment_dislikes;
CREATE POLICY "Users can delete own comment_dislikes" ON public.comment_dislikes FOR DELETE USING (auth.uid() = user_id);
