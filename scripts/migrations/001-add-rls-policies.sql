-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dawyfazhbxhajhvrcvuy/sql/new

-- 1. Allow users to update their own routes
CREATE POLICY "Users can update their own routes"
ON "public"."routes"
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Allow admins and gov_officials to update any route
CREATE POLICY "Admins can update any route"
ON "public"."routes"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'gov_official')
  )
);

-- 3. Allow users to delete their own routes
CREATE POLICY "Users can delete their own routes"
ON "public"."routes"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Allow admins and gov_officials to delete any route
CREATE POLICY "Admins can delete any route"
ON "public"."routes"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'gov_official')
  )
);
