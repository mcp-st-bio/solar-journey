export type Phase = 'lobby'|'negotiation'|'secret'|'result'|'guess'|'finished';
export type EnergyType = '태양E'|'화학E'|'전기E'|'운동E'|'위치E';
export type Energy = { id:string; type:EnergyType; path:string };
export type Player = { id:string; token:string; name:string; role:string; inventory:Energy[]; converted:boolean; transferred:boolean; inbox:string[]; stats:{made:number;converted:number;sent:number;received:number;car:number;paths:string[]}; guess?:string };
export type Room = { code:string; group:number; set:string; phase:Phase; round:number; deadline:number|null; players:Player[]; paths:string[]; log:string[] };
export type Session = { code:string; teacherToken:string; createdAt:number; rooms:Room[] };

export const ROLE_SETS:Record<string,string[]> = {
  A:['태양','자동차','식물','화석연료','대기·바람','풍력발전소'],
  B:['태양','자동차','식물','화석연료','물순환','수력발전소'],
  C:['태양','자동차','대기·바람','풍력발전소','물순환','수력발전소'],
  D:['태양','자동차','식물','화석연료','태양광발전소','화력발전소'],
};
export const FIVE_PLAYER_ROLE_SETS:Record<string,string[]> = {
  A:['태양','자동차','식물','화석연료','대기·바람＋풍력발전소'],
  B:['태양','자동차','식물','화석연료','물순환＋수력발전소'],
  C:['태양','자동차','대기·바람＋풍력발전소','물순환','수력발전소'],
  D:['태양','자동차','식물','태양광발전소','화석연료＋화력발전소'],
};
export const ROLE_INFO:Record<string,{rule:string;goal:string}> = {
  '태양':{rule:'1~4라운드 비밀 행동 시작 시 태양에너지 1개 생성',goal:'태양에너지를 2개 이상 다른 플레이어에게 전달'},
  '자동차':{rule:'화석연료 화학E 또는 전기E를 받으면 운동E로 자동 전환',goal:'서로 다른 에너지 경로 2종을 완성'},
  '식물':{rule:'태양E → 화학E',goal:'에너지를 2회 이상 전환'},
  '화석연료':{rule:'식물 유래 화학E를 화석연료 상태로 저장',goal:'화석연료 화학E를 자동차에 전달'},
  '태양광발전소':{rule:'태양E → 전기E',goal:'전기E를 자동차에 전달'},
  '대기·바람':{rule:'태양E → 운동E',goal:'에너지를 2회 이상 전환'},
  '풍력발전소':{rule:'운동E → 전기E',goal:'전기E를 자동차에 전달'},
  '물순환':{rule:'태양E → 위치E',goal:'에너지를 2회 이상 전환'},
  '수력발전소':{rule:'위치E → 전기E',goal:'전기E를 자동차에 전달'},
  '화력발전소':{rule:'화석연료 화학E → 전기E (열·터빈 과정)',goal:'전기E를 자동차에 전달'},
  '대기·바람＋풍력발전소':{rule:'태양E → 운동E → 전기E (각 전환은 서로 다른 라운드)',goal:'풍력 경로의 전기E를 자동차에 전달'},
  '물순환＋수력발전소':{rule:'태양E → 위치E → 전기E (각 전환은 서로 다른 라운드)',goal:'수력 경로의 전기E를 자동차에 전달'},
  '화석연료＋화력발전소':{rule:'식물 유래 화학E를 화석연료로 저장하거나 전기E로 전환',goal:'화석연료 직접 경로와 화력발전 경로를 모두 완성'},
};
type Conversion={from:EnergyType;to:EnergyType;needs?:string;tag?:string};
const conversion:Record<string,Conversion[]> = {
  '식물':[{from:'태양E',to:'화학E',tag:'식물'}], '화석연료':[{from:'화학E',to:'화학E',needs:'식물',tag:'화석연료'}],
  '태양광발전소':[{from:'태양E',to:'전기E',tag:'태양광'}], '대기·바람':[{from:'태양E',to:'운동E',tag:'바람'}],
  '풍력발전소':[{from:'운동E',to:'전기E',needs:'바람'}], '물순환':[{from:'태양E',to:'위치E',tag:'물'}],
  '수력발전소':[{from:'위치E',to:'전기E',needs:'물'}], '화력발전소':[{from:'화학E',to:'전기E',needs:'화석연료',tag:'화력'}],
  '대기·바람＋풍력발전소':[{from:'운동E',to:'전기E',needs:'바람'},{from:'태양E',to:'운동E',tag:'바람'}],
  '물순환＋수력발전소':[{from:'위치E',to:'전기E',needs:'물'},{from:'태양E',to:'위치E',tag:'물'}],
  '화석연료＋화력발전소':[{from:'화학E',to:'전기E',needs:'화석연료',tag:'화력'},{from:'화학E',to:'화학E',needs:'식물',tag:'화석연료'}],
};
const uid=()=>crypto.randomUUID();
const shuffle=<T,>(a:T[])=>a.map(v=>({v,r:Math.random()})).sort((x,y)=>x.r-y.r).map(x=>x.v);
export function newSession():Session { const code=String(Math.floor(1000+Math.random()*9000)); const base=['A','B','C','D'];const sets=shuffle([...base,base[Math.floor(Math.random()*base.length)]]);return {code,teacherToken:uid(),createdAt:Date.now(),rooms:sets.map((set,i)=>({code:`${code}-${i+1}`,group:i+1,set,phase:'lobby',round:0,deadline:null,players:[],paths:[],log:[]}))}; }
export function join(room:Room,name:string){ if(room.phase!=='lobby')throw Error('이미 시작된 조입니다.'); if(room.players.length>=6)throw Error('이 조는 6명이 모두 참여했습니다.'); if(room.players.some(p=>p.name===name))throw Error('같은 이름이 이미 있습니다.'); const p:Player={id:uid(),token:uid(),name,role:'',inventory:[],converted:false,transferred:false,inbox:[],stats:{made:0,converted:0,sent:0,received:0,car:0,paths:[]}}; room.players.push(p); return p; }
export function start(room:Room){ if(room.players.length<5)throw Error('경로를 유지하려면 최소 5명이 참여해야 합니다.'); const roles=shuffle(room.players.length===5?FIVE_PLAYER_ROLE_SETS[room.set]:ROLE_SETS[room.set]); room.players.forEach((p,i)=>p.role=roles[i]); room.round=1; room.phase='negotiation'; room.deadline=Date.now()+120000; room.log.unshift(`${room.players.length}명으로 게임 시작 · 1라운드 협상`); }
export function advance(room:Room){
  if(room.phase==='lobby')return start(room);
  if(room.phase==='negotiation'){ room.phase='secret'; room.deadline=Date.now()+30000; room.players.forEach(p=>{p.converted=false;p.transferred=false}); if(room.round<=4){const sun=room.players.find(p=>p.role==='태양'); if(sun){sun.inventory.push({id:uid(),type:'태양E',path:'태양'});sun.stats.made++;sun.inbox.unshift(`${room.round}라운드 태양E 1개 생성`)}} room.log.unshift(`${room.round}R 비밀 행동`); return; }
  if(room.phase==='secret'){room.phase='result';room.deadline=Date.now()+30000;room.log.unshift(`${room.round}R 결과 확인`);return;}
  if(room.phase==='result'){if(room.round===6){room.phase='guess';room.deadline=null;room.log.unshift('최종 역할 추리');}else{room.round++;room.phase='negotiation';room.deadline=Date.now()+120000;room.log.unshift(`${room.round}R 협상`);}return;}
  if(room.phase==='guess'){room.phase='finished';room.deadline=null;room.log.unshift('게임 종료');}
}
export function convertEnergy(room:Room,p:Player,energyId:string){ if(room.phase!=='secret'||p.converted)throw Error('지금은 전환할 수 없습니다.'); const rules=conversion[p.role]; if(!rules)throw Error('이 역할은 직접 전환하지 않습니다.'); const e=p.inventory.find(x=>x.id===energyId); const rule=e&&rules.find(r=>e.type===r.from&&(!r.needs||e.path.includes(r.needs))); if(!e||!rule)throw Error('전환 가능한 에너지가 없습니다.'); e.type=rule.to; if(rule.tag)e.path+=`→${rule.tag}`; p.converted=true;p.stats.converted++;room.log.unshift(`${p.name}이(가) 에너지를 전환함`); }
function pathKey(path:string){const steps=path.split('→');if(steps.includes('화력'))return '화력 경로';if(steps.includes('태양광'))return '태양광 경로';if(steps.includes('바람'))return '풍력 경로';if(steps.includes('물'))return '수력 경로';return '화석연료 경로'}
export function transfer(room:Room,p:Player,toId:string,energyId:string){ if(room.phase!=='secret'||p.transferred)throw Error('지금은 전달할 수 없습니다.'); if(toId===p.id)throw Error('자기 자신에게는 전달할 수 없습니다.'); const to=room.players.find(x=>x.id===toId); const i=p.inventory.findIndex(e=>e.id===energyId); if(!to||i<0)throw Error('전달 대상을 확인해 주세요.'); const [e]=p.inventory.splice(i,1);p.transferred=true;p.stats.sent++;to.stats.received++;
  if(to.role==='자동차'&&(e.type==='전기E'||(e.type==='화학E'&&e.path.includes('화석연료')))){const key=pathKey(e.path);if(!room.paths.includes(key))room.paths.push(key);to.stats.car++;p.stats.car++;p.stats.paths??=[];if(!p.stats.paths.includes(key))p.stats.paths.push(key);to.inbox.unshift(`${e.type} 수신 → 운동E 자동 전환 · ${key} 완성!`);room.log.unshift(`자동차 경로 완성: ${key}`);}else{to.inventory.push(e);to.inbox.unshift(`${e.type} 1개를 익명으로 받음`);room.log.unshift(`익명으로 ${e.type} 전달됨`);}}
export function personalSuccess(p:Player,room:Room){if(p.role==='태양')return p.stats.sent>=2;if(p.role==='자동차')return room.paths.length>=2;if(['식물','대기·바람','물순환'].includes(p.role))return p.stats.converted>=2;if(p.role==='화석연료＋화력발전소')return ['화석연료 경로','화력 경로'].every(x=>(p.stats.paths||[]).includes(x));return p.stats.car>=1;}
export function scores(room:Room){const common=room.paths.length>=2;const guessed=new Map<string,number>();room.players.forEach(p=>{const targetId=p.guess?.split('|')[0];if(targetId)guessed.set(targetId,(guessed.get(targetId)||0)+1)});return room.players.map(p=>{const [targetId,roleGuess]=p.guess?.split('|')||[];const target=room.players.find(x=>x.id===targetId);const correct=!!target&&target.role===roleGuess;const personal=personalSuccess(p,room);return{id:p.id,name:p.name,role:p.role,common,personal,guessCorrect:correct,revealed:guessed.has(p.id),score:(common?0:-2)+(personal?3:0)+(correct?1:0)-(guessed.has(p.id)?1:0)}})}
