import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { readOpportunity,readOpportunities } from '@/lib/opportunities';
const page=z.coerce.number().int().min(1).max(100000);
const query=z.union([z.object({id:z.uuid()}).strict(),z.object({page,contact_id:z.uuid().optional(),company_id:z.uuid().optional()}).strict().refine(v=>!v.contact_id||!v.company_id)]);
export async function GET(request:NextRequest){const parsed=query.safeParse(Object.fromEntries(request.nextUrl.searchParams));const headers={'Cache-Control':'no-store'};if(!parsed.success)return NextResponse.json({status:'validation',message:'Lecture non valide.'},{status:400,headers});const p=parsed.data;return NextResponse.json('id'in p?await readOpportunity(p.id):await readOpportunities(p.page,p),{headers});}
