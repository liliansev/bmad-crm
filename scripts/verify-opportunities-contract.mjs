import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {decimalToCents,centsToDecimal,opportunityCommandSchema,opportunityResultSchema} from '../lib/validations/opportunities.ts';
const checks=[];const check=(name,test)=>{assert.ok(test,name);checks.push({name,passed:true});};
for(const [input,expected] of [['',null],['  ',null],['0','0'],['0,01','1'],['1234.56','123456'],['0001,2','120'],['92233720368547758,07','9223372036854775807']])check('Conversion exacte '+input,decimalToCents(input)===expected);
for(const input of ['-0','-1','+1','1e2','1,234','1 234','1.','1,','NaN','Infinity','92233720368547758,08']){assert.throws(()=>decimalToCents(input));check('Saisie refusée '+input,true);}
for(const value of [null,'0','1','123456','9223372036854775807'])check('Aller retour exact '+value,decimalToCents(centsToDecimal(value))===value);
const cmd={operation:'create',command_id:randomUUID(),fields:{title:'123 😀',notes:' \n ',amount_cents:null,company_id:null,primary_contact_id:null}};
check('Titre chiffres et Notes conservées',opportunityCommandSchema.parse(cmd).fields.notes===' \n ');
for(const [field,value] of [['title',' '],['title','😀'.repeat(201)],['title','\ud800'],['notes','\u0000'],['notes','😀'.repeat(20001)],['amount_cents','01'],['amount_cents',0],['amount_cents','9223372036854775808']])check('Frontière '+field,!opportunityCommandSchema.safeParse({...cmd,fields:{...cmd.fields,[field]:value}}).success);
const update={operation:'update',command_id:randomUUID(),opportunity_id:randomUUID(),fields:{notes:''},base_versions:{notes:1}};
check('Patch ciblé valide',opportunityCommandSchema.safeParse(update).success);
for(const extra of [{fields:{},base_versions:{}},{base_versions:{}},{base_versions:{notes:1,title:1}},{fields:{stage:'won'},base_versions:{stage:1}},{base_versions:{notes:1.2}}])check('Patch invalide',!opportunityCommandSchema.safeParse({...update,...extra}).success);
check('Étape transaction distincte',opportunityCommandSchema.safeParse({operation:'transition',command_id:randomUUID(),opportunity_id:randomUUID(),stage:'won',base_workflow_revision:1}).success);
const o={...cmd.fields,id:randomUUID(),stage:'qualifying',revision:1,workflow_revision:1,field_versions:{title:1,notes:1,amount_cents:1,company_id:1,primary_contact_id:1},created_at:'2026-01-01',updated_at:'2026-01-01'};
check('Projection montant numérique refusée',!opportunityResultSchema.safeParse({status:'success',opportunity:{...o,amount_cents:1}}).success);
await mkdir('_bmad-output/implementation-artifacts/verification/3-1',{recursive:true});await writeFile('_bmad-output/implementation-artifacts/verification/3-1/opportunities-contract.json',JSON.stringify({success:true,checks},null,2));console.log(`PASS ${checks.length} contrôles contrat et conversion`);
