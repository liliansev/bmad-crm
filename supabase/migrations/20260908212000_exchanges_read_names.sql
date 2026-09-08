begin;
-- Read-only identities: command contracts and historical receipts stay untouched.
create or replace function public.exchanges_read(p_contact_id uuid default null,p_company_id uuid default null,p_page integer default 1) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_total bigint;v_last jsonb;v_rows jsonb;
begin
 if auth.uid() is null then return jsonb_build_object('status','unauthenticated','message','Reconnectez-vous.');end if;
 if not private.is_crm_owner() then return jsonb_build_object('status','forbidden','message','Cet espace est privé.');end if;
 if p_page is null or p_page<1 or p_page>100000 or (p_contact_id is null)=(p_company_id is null) then return jsonb_build_object('status','validation','message','Lecture non valide.');end if;
 if p_contact_id is not null and not exists(select 1 from public.contacts where owner_id=auth.uid() and id=p_contact_id) or p_company_id is not null and not exists(select 1 from public.companies where owner_id=auth.uid() and id=p_company_id) then return jsonb_build_object('status','not_found','message','Fiche introuvable.');end if;
 select count(*) into v_total from public.exchanges where owner_id=auth.uid() and (p_contact_id is null or contact_id=p_contact_id) and (p_company_id is null or company_id=p_company_id);
 select (to_jsonb(e)-'owner_id')||jsonb_build_object('contact_name',private.contact_trim(c.first_name||' '||c.last_name),'company_name',s.name) into v_last from public.exchanges e join public.contacts c on c.owner_id=e.owner_id and c.id=e.contact_id left join public.companies s on s.owner_id=e.owner_id and s.id=e.company_id where e.owner_id=auth.uid() and (p_contact_id is null or e.contact_id=p_contact_id) and (p_company_id is null or e.company_id=p_company_id) order by e.occurred_at desc,e.created_at desc,e.id desc limit 1;
 select coalesce(jsonb_agg(to_jsonb(e)-'owner_id'),'[]'::jsonb) into v_rows from (select x.*,private.contact_trim(c.first_name||' '||c.last_name) contact_name,s.name company_name from public.exchanges x join public.contacts c on c.owner_id=x.owner_id and c.id=x.contact_id left join public.companies s on s.owner_id=x.owner_id and s.id=x.company_id where x.owner_id=auth.uid() and (p_contact_id is null or x.contact_id=p_contact_id) and (p_company_id is null or x.company_id=p_company_id) order by x.occurred_at desc,x.created_at desc,x.id desc limit 25 offset (p_page-1)*25) e;
 return jsonb_build_object('status','success','exchanges',v_rows,'total',v_total,'page',p_page,'last_interaction',v_last);
end;$$;
commit;
