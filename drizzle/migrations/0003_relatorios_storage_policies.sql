create policy "Usuário lê seus relatórios"
on storage.objects for select to authenticated
using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuário salva seus relatórios"
on storage.objects for insert to authenticated
with check (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuário atualiza seus relatórios"
on storage.objects for update to authenticated
using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Usuário apaga seus relatórios"
on storage.objects for delete to authenticated
using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);