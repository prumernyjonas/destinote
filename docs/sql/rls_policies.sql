-- RLS (Row Level Security) politiky pro tabulku users
-- Spusť tento SQL v Supabase SQL Editor

-- 1. Povolit RLS na tabulce users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Politika: Uživatelé mohou číst svůj vlastní záznam (včetně role)
-- Používáme (auth.uid()::text = id::text) pro lepší kompatibilitu
CREATE POLICY "Users can read own profile"
ON users
FOR SELECT
USING (auth.uid()::text = id::text);

-- 3. Politika: Admin a moderator mohou číst všechny záznamy
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'moderator')
  )
);

-- 4. Politika: Uživatelé mohou aktualizovat svůj vlastní záznam (ale ne roli)
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Uživatel nemůže změnit svou roli (role zůstává stejná)
  AND role = (SELECT role FROM users WHERE id = auth.uid())
);

-- 5. Politika: Admin může aktualizovat jakýkoliv záznam (včetně role)
CREATE POLICY "Admins can update any user"
ON users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 6. Politika: Noví uživatelé mohou vytvořit svůj vlastní záznam při registraci
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Poznámka: Pro úplné odstranění záznamu (DELETE) by měla být samostatná politika,
-- ale v tomto projektu používáme soft delete (deleted_at), takže DELETE není potřeba.

-- =============================================================================
-- RLS politiky pro tabulku user_follows (sledování uživatelů)
-- =============================================================================

-- 1. Povolit RLS na tabulce user_follows
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- 2. Politika: Všichni autentizovaní uživatelé mohou číst sledování (profily jsou veřejné)
CREATE POLICY "Anyone can read follows"
ON user_follows
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Politika: Uživatel může sledovat pouze za sebe a nemůže sledovat sám sebe
CREATE POLICY "Users can follow others"
ON user_follows
FOR INSERT
WITH CHECK (
  auth.uid()::text = follower_id::text
  AND follower_id != following_id
);

-- 4. Politika: Uživatel může zrušit pouze své vlastní sledování
CREATE POLICY "Users can unfollow"
ON user_follows
FOR DELETE
USING (auth.uid()::text = follower_id::text);

