begin;
-- The Contacts table needs only global counts, never 25 pages of Notes DTOs.
create function public.contacts_opportunity_counts(p_ids uuid[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if auth.uid() is null or not private.is_crm_owner() then raise insufficient_privilege;end if;
 if p_ids is null or cardinality(p_ids)>25 or array_position(p_ids,null) is not null then raise invalid_parameter_value;end if;
 if exists(select 1 from unnest(p_ids) x where not exists(select 1 from public.contacts c where c.owner_id=auth.uid() and c.id=x)) then raise insufficient_privilege;end if;
 select coalesce(jsonb_object_agg(id,total),'{}'::jsonb) into v_result from (
  select c.id,count(o.id) total from public.contacts c left join public.opportunities o on o.owner_id=c.owner_id and o.primary_contact_id=c.id where c.owner_id=auth.uid() and c.id=any(p_ids) group by c.id
 ) counts;
 return v_result;
end;$$;
revoke all on function public.contacts_opportunity_counts(uuid[]) from public,anon,authenticated;
grant execute on function public.contacts_opportunity_counts(uuid[]) to authenticated;
commit;
