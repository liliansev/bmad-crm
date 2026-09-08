import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {readExchanges} from '@/lib/exchanges';
const page=z.coerce.number().int().min(1).max(100000);
const query=z.union([z.object({contact_id:z.uuid(),page}).strict(),z.object({company_id:z.uuid(),page}).strict()]);
export async function GET(request:NextRequest){const parsed=query.safeParse(Object.fromEntries(request.nextUrl.searchParams));const headers={'Cache-Control':'no-store'};if(!parsed.success)return NextResponse.json({status:'validation',message:'Lecture non valide.'},{status:400,headers});return NextResponse.json(await readExchanges(parsed.data,parsed.data.page),{headers});}
