import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createServerClient} from '@supabase/ssr';
import {z} from 'zod';
import {signOutQaSession} from './contacts-qa-cleanup.mjs';
const s=z.object({project_ref:z.literal('otadrkhrjxafutocstzo'),anon_key:z.string(),owner_id:z.uuid(),owner_email:z.email(),owner_password:z.string()}).parse(JSON.parse(await readFile('.local/bootstrap-secrets.json','utf8')));
const jar=new Map();const client=createServerClient(`https://${s.project_ref}.supabase.co`,s.anon_key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
const results=[];let failure,finalized=false;const check=(name,passed)=>{results.push({name,passed:!!passed});if(!passed)throw new Error(name);};
try{
 const auth=await client.auth.signInWithPassword({email:s.owner_email,password:s.owner_password});check('Session propriétaire isolée',!auth.error&&auth.data.user?.id===s.owner_id);
 const Cookie=[...jar].map(([name,value])=>`${name}=${value}`).join('; ');
 const response=await fetch('http://localhost:3000/api/opportunities?page=1',{headers:{Cookie},redirect:'manual'});const page=await response.json();check('HTTP lecture propriétaire authentique',response.status===200&&page.status==='success');
 const command={operation:'update',command_id:randomUUID(),opportunity_id:randomUUID(),fields:{notes:'Commande refusée fictive'},base_versions:{notes:1}};
 for(const [name,extra] of [['Origine tierce403',{Origin:'https://foreign.example.invalid'}],['Sec-fetch-site cross-site403',{Origin:'http://localhost:3000','Sec-Fetch-Site':'cross-site'}],['Origine absente403',{}]]){
  const r=await fetch('http://localhost:3000/api/opportunities/command',{method:'POST',headers:{Cookie,'Content-Type':'application/json',...extra},body:JSON.stringify(command)});const body=await r.json();check(name,r.status===403&&body.status==='forbidden');
 }
 const counts=await fetch('http://localhost:3000/api/contacts?version=2&page=1',{headers:{Cookie}});const list=await counts.json();check('Liste Contacts avec compteurs groupés',list.status==='success'&&list.contacts.every(c=>Number.isSafeInteger(c.opportunity_count)&&c.opportunity_count>=0));
}catch(error){failure=error.message;}finally{try{await signOutQaSession(client);finalized=true;}catch{failure='Fermeture session QA incomplète';}jar.clear();}
const success=!failure&&finalized;await mkdir('_bmad-output/implementation-artifacts/verification/3-1',{recursive:true});await writeFile('_bmad-output/implementation-artifacts/verification/3-1/opportunities-http-security.json',JSON.stringify({success,at:new Date().toISOString(),node:process.version,results,finalized,failure},null,2));console.log({success,checks:results.length,finalized,failure});if(!success)process.exitCode=1;
