import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { readCompanies,readCompany,readCompanyContacts } from "@/lib/companies";
const page=z.coerce.number().int().min(1).max(100000);
const query=z.union([z.object({id:z.uuid()}).strict(),z.object({page}).strict(),z.object({company_id:z.uuid(),page}).strict()]);
export async function GET(request:NextRequest){const parsed=query.safeParse(Object.fromEntries(request.nextUrl.searchParams));const headers={"Cache-Control":"no-store"};if(!parsed.success)return NextResponse.json({status:"validation",message:"Lecture non valide."},{status:400,headers});const p=parsed.data;return NextResponse.json("id" in p?await readCompany(p.id):"company_id" in p?await readCompanyContacts(p.company_id,p.page):await readCompanies(p.page),{headers});}
