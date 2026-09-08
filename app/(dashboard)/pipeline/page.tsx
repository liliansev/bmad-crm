import type {Metadata} from 'next';
import {z} from 'zod';
import {requireOwner} from '@/lib/auth';
import {getServerEnv} from '@/lib/env';
import {readOpportunities} from '@/lib/opportunities';
import {OpportunitiesShell} from '@/components/opportunities/opportunities-shell';
export const metadata:Metadata={title:'Pipeline'};
const schema=z.object({page:z.coerce.number().int().min(1).max(100000).catch(1),panel:z.union([z.uuid(),z.literal('new')]).optional().catch(undefined),contact_id:z.uuid().optional().catch(undefined),company_id:z.uuid().optional().catch(undefined)});
export default async function PipelinePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){await requireOwner();const query=schema.parse(await searchParams);const context=query.contact_id?{contact_id:query.contact_id}:query.company_id?{company_id:query.company_id}:{};return <OpportunitiesShell key={query.contact_id??query.company_id??'all'} ownerId={getServerEnv().SUPABASE_OWNER_ID} initial={await readOpportunities(query.page,context)} initialPage={query.page} initialPanel={query.panel??null} context={context}/>;}
