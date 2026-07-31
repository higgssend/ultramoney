-- Script para crear el Bucket de Storage para Documentos y Recibos
-- Ejecutar en el SQL Editor de InsForge / Supabase

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

-- Política RLS para permitir acceso público de lectura
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'documents' );

-- Política RLS para permitir subir archivos
create policy "Allow Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'documents' );
