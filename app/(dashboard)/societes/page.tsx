import type { Metadata } from 'next';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth';
import { getServerEnv } from '@/lib/env';
import { readCompanies } from '@/lib/companies';
import { CompaniesShell } from '@/components/companies/companies-shell';
export const metadata:Metadata={title:'Sociétés'};
const schema=z.object({page:z.coerce.number().int().min(1).max(100000).catch(1),panel:z.union([z.uuid(),z.literal('new')]).optional().catch(undefined)});
export default async function CompaniesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){await requireOwner();const query=schema.parse(await searchParams);return <CompaniesShell ownerId={getServerEnv().SUPABASE_OWNER_ID} initial={await readCompanies(query.page)} initialPage={query.page} initialPanel={query.panel??null}/>;}
