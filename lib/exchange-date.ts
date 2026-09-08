/** Paris wall time is resolved by round-tripping candidates, never by Date normalization. */
const paris = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function parisLocalNow(now = new Date()): string { return paris.format(now).replace(' ', 'T'); }
export function parisCandidates(local: string): { instant: string; offset: string }[] {
 if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
 const year=Number(local.slice(0,4)); if(year<1||year>9999)return [];
 const wall=Date.parse(`${local}:00Z`); if(!Number.isFinite(wall)||new Date(wall).toISOString().slice(0,16)!==local)return [];
 const candidates: {instant:string;offset:string}[]=[];
 const offsetFormatter = new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Paris',timeZoneName:'longOffset'});
 const offsets=new Set<number>();
 for(const delta of [-86400000,0,86400000]) {
  const zone=offsetFormatter.formatToParts(new Date(wall+delta)).find(part=>part.type==='timeZoneName')?.value;
  const match=zone?.match(/^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if(zone==='GMT')offsets.add(0);
  if(match)offsets.add((match[1]==='-'?-1:1)*(Number(match[2])*3600+Number(match[3])*60+Number(match[4]??0)));
 }
 for(const offset of offsets) {const instant=new Date(wall-offset*1000);if(parisLocalNow(instant)===local)candidates.push({instant:instant.toISOString(),offset:`UTC${offset<0?'-':'+'}${String(Math.floor(Math.abs(offset)/3600)).padStart(2,'0')}:${String(Math.floor(Math.abs(offset)%3600/60)).padStart(2,'0')}${offset%60?':'+String(Math.abs(offset)%60).padStart(2,'0'):''}`});}
 return candidates.sort((a,b)=>a.instant.localeCompare(b.instant));
}
export function resolveParisDate(local:string, occurrence?:string): { instant:string } | { error:string } {
 const candidates=parisCandidates(local);
 if(!candidates.length)return {error:'Date invalide ou heure inexistante en Europe/Paris.'};
 if(candidates.length>1&&!occurrence)return {error:'Cette heure est ambiguë. Choisissez son occurrence et son décalage UTC.'};
 const candidate=occurrence?candidates.find(c=>c.instant===occurrence):candidates[0];
 return candidate?{instant:candidate.instant}:{error:'Occurrence non valide pour cette heure de Paris.'};
}
export function formatExchangeDate(instant:string):string {
 const date=new Date(instant);
 const formatted=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'medium',timeStyle:'short'}).format(date);
 const candidates=parisCandidates(parisLocalNow(date));
 if(candidates.length<2)return formatted;
 const occurrence=candidates.find(candidate=>{const delta=date.getTime()-Date.parse(candidate.instant);return delta>=0&&delta<60000;});
 return occurrence?`${formatted} (${occurrence.offset})`:formatted;
}
