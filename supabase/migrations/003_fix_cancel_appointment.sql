-- =============================================
-- FIX: cliente não consegue cancelar o agendamento
-- =============================================
-- Causa: a policy de UPDATE usava
--   using (auth.uid() = client_id and status = 'pending')
-- sem um WITH CHECK próprio. O Postgres reaproveita o USING
-- para validar a LINHA NOVA, então mudar status para
-- 'cancelled' falhava (status != 'pending'). Além disso,
-- agendamentos 'confirmed' nunca podiam ser cancelados.
--
-- Solução: identificar a linha pelo dono (USING) e validar a
-- linha nova também pelo dono (WITH CHECK), sem travar o status.
--
-- Execute este script no SQL Editor do Supabase.
-- =============================================

drop policy if exists "Clientes cancelam próprios agendamentos" on public.appointments;
create policy "Clientes cancelam próprios agendamentos"
  on public.appointments for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);
