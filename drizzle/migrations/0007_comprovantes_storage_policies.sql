CREATE POLICY "comprovantes_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "comprovantes_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "comprovantes_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);