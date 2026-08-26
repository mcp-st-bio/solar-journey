export type Phase='lobby'|'negotiation'|'secret'|'result'|'guess'|'finished';
export type EnergyType='태양E'|'화학E'|'전기E'|'운동E'|'위치E';
export type Energy={id:string;type:EnergyType;path:string};
export type Player={id:string;token:string;name:string;role:string;inventory:Energy[];converted:boolean;transferred:boolean;pendingTransfer?:{toId:string;energyId:string};inbox:string[];stats:{converted:number;sent:number;received:number;car:number;paths:string[]};guess?:string};
export type Room={code:string;group:number;set:string;phase:Phase;round:number;deadline:number|null;players:Player[];paths:string[];log:string[]};
export type Session={code:string;teacherToken:string;createdAt:number;rooms:Room[]};

export const ROLE_SETS:Record<string,string[]>={
 A:['식물','화석연료','대기·바람','풍력발전소'],
 B:['식물','화석연료','물순환','수력발전소'],
 C:['대기·바람','풍력발전소','물순환','수력발전소'],
 D:['식물','화석연료','태양광발전소','화력발전소'],
};
export const ROLE_INFO:Record<string,{rule:string;goal:string}>={
 '식물':{rule:'태양E 조각 2개 → 식물 화학E 1개',goal:'에너지를 2회 이상 전환'},
 '화석연료':{rule:'식물 화학E → 화석연료 화학E',goal:'화석연료 화학E를 자동차에 직접 전달'},
 '태양광발전소':{rule:'태양E 조각 2개 → 전기E 1개',goal:'태양광 전기E를 자동차에 전달'},
 '대기·바람':{rule:'태양E 조각 2개 → 운동E 1개',goal:'에너지를 2회 이상 전환'},
 '풍력발전소':{rule:'운동E → 전기E',goal:'풍력 전기E를 자동차에 전달'},
 '물순환':{rule:'태양E 조각 2개 → 위치E 1개',goal:'에너지를 2회 이상 전환'},
 '수력발전소':{rule:'위치E → 전기E',goal:'수력 전기E를 자동차에 전달'},
 '화력발전소':{rule:'화석연료 화학E → 전기E',goal:'화력 전기E를 자동차에 전달'},
};
type Conversion={from:EnergyType;to:EnergyType;cost:number;needs?:string;tag:string};
const conversion:Record<string,Conversion>={
 '식물':{from:'태양E',to:'화학E',cost:2,tag:'식물'},'화석연료':{from:'화학E',to:'화학E',cost:1,needs:'식물',tag:'화석연료'},
 '태양광발전소':{from:'태양E',to:'전기E',cost:2,tag:'태양광'},'대기·바람':{from:'태양E',to:'운동E',cost:2,tag:'바람'},
 '풍력발전소':{from:'운동E',to:'전기E',cost:1,needs:'바람',tag:'풍력'},'물순환':{from:'태양E',to:'위치E',cost:2,tag:'물'},
 '수력발전소':{from:'위치E',to:'전기E',cost:1,needs:'물',tag:'수력'},'화력발전소':{from:'화학E',to:'전기E',cost:1,needs:'화석연료',tag:'화력'},
};
const uid=()=>crypto.randomUUID();
const shuffle=<T,>(a:T[])=>a.map(v=>({v,r:Math.random()})).sort((x,y)=>x.r-y.r).map(x=>x.v);

export function rolesFor(set:string,count:number){const base=ROLE_SETS[set];if(!base||count<7||count>9)throw Error('지원하지 않는 인원입니다.');const roles=[...base];while(roles.length<count){const currentMin=Math.min(...base.map(r=>roles.filter(x=>x===r).length));const candidates=base.filter(r=>roles.filter(x=>x===r).length===currentMin);roles.push(shuffle(candidates)[0]);}return shuffle(roles)}
export function newSession():Session{const code=String(Math.floor(1000+Math.random()*9000));const base=['A','B','C','D'];const sets=shuffle([...base,base[Math.floor(Math.random()*base.length)]]);return{code,teacherToken:uid(),createdAt:Date.now(),rooms:sets.map((set,i)=>({code:`${code}-${i+1}`,group:i+1,set,phase:'lobby',round:0,deadline:null,players:[],paths:[],log:[]}))}}
export function join(room:Room,name:string){if(room.phase!=='lobby')throw Error('이미 시작된 조입니다.');if(room.players.length>=9)throw Error('이 조는 9명이 모두 참여했습니다.');if(room.players.some(p=>p.name===name))throw Error('같은 이름이 이미 있습니다.');const p:Player={id:uid(),token:uid(),name,role:'',inventory:[],converted:false,transferred:false,inbox:[],stats:{converted:0,sent:0,received:0,car:0,paths:[]}};room.players.push(p);return p}
export function start(room:Room){if(room.players.length<7)throw Error('최소 7명이 참여해야 합니다.');const roles=rolesFor(room.set,room.players.length);room.players.forEach((p,i)=>p.role=roles[i]);room.round=1;room.phase='negotiation';room.deadline=Date.now()+120000;room.log.unshift(`${room.players.length}명으로 게임 시작`)}
function supplySolar(room:Room){if(room.round>6)return;const count=Math.ceil(room.players.length/2);for(const p of shuffle(room.players).slice(0,count)){p.inventory.push({id:uid(),type:'태양E',path:'태양'});p.inbox.unshift(`${room.round}라운드 태양E 조각 1개 공급`)}room.log.unshift(`태양E 조각 ${count}개 무작위 공급`)}
export function advance(room:Room){
 if(room.phase==='lobby')return start(room);
 if(room.phase==='negotiation'){room.phase='secret';room.deadline=Date.now()+45000;room.players.forEach(p=>{p.converted=false;p.transferred=false;delete p.pendingTransfer});supplySolar(room);room.log.unshift(`${room.round}R 비밀 행동`);return}
 if(room.phase==='secret'){resolveTransfers(room);room.phase='result';room.deadline=Date.now()+30000;room.log.unshift(`${room.round}R 결과 확인`);return}
 if(room.phase==='result'){if(room.round===8){room.phase='guess';room.deadline=null;room.log.unshift('최종 역할 추리')}else{room.round++;room.phase='negotiation';room.deadline=Date.now()+120000;room.log.unshift(`${room.round}R 협상`)}return}
 if(room.phase==='guess'){room.phase='finished';room.deadline=null;room.log.unshift('게임 종료')}
}
export function convertEnergy(room:Room,p:Player,energyIds:string[]){if(room.phase!=='secret'||p.converted)throw Error('지금은 전환할 수 없습니다.');const rule=conversion[p.role];if(!rule)throw Error('이 역할은 전환할 수 없습니다.');const ids=[...new Set(energyIds)];const selected=ids.map(id=>p.inventory.find(e=>e.id===id)).filter(Boolean) as Energy[];if(selected.length!==rule.cost||selected.some(e=>e.type!==rule.from||(rule.needs&&!e.path.split('→').includes(rule.needs))))throw Error(`전환에 필요한 에너지를 ${rule.cost}개 선택하세요.`);const firstIndex=p.inventory.findIndex(e=>e.id===selected[0].id);p.inventory=p.inventory.filter(e=>!ids.includes(e.id));const path=selected[0].path+`→${rule.tag}`;p.inventory.splice(Math.max(0,firstIndex),0,{id:uid(),type:rule.to,path});p.converted=true;p.stats.converted++;p.inbox.unshift(`${selected.map(e=>e.type).join('+')} → ${rule.to} 전환 완료`)}
export function transfer(room:Room,p:Player,toId:string,energyId:string){if(room.phase!=='secret'||p.transferred)throw Error('지금은 전달을 제출할 수 없습니다.');if(toId===p.id)throw Error('자기 자신에게는 전달할 수 없습니다.');if(toId!=='CAR'&&!room.players.some(x=>x.id===toId))throw Error('전달 대상을 확인해 주세요.');if(!p.inventory.some(e=>e.id===energyId))throw Error('보낼 에너지를 확인해 주세요.');p.pendingTransfer={toId,energyId};p.transferred=true}
function pathKey(path:string){const s=path.split('→');if(s.includes('화력'))return'화력 경로';if(s.includes('태양광'))return'태양광 경로';if(s.includes('풍력')||s.includes('바람'))return'풍력 경로';if(s.includes('수력')||s.includes('물'))return'수력 경로';return'화석연료 경로'}
function resolveTransfers(room:Room){for(const p of room.players){const plan=p.pendingTransfer;if(!plan)continue;const i=p.inventory.findIndex(e=>e.id===plan.energyId);if(i<0)continue;const e=p.inventory[i];if(plan.toId==='CAR'){const valid=e.type==='전기E'||(e.type==='화학E'&&e.path.split('→').includes('화석연료'));if(!valid){p.inbox.unshift(`자동차가 ${e.type}를 사용할 수 없어 보관함에 남음`);continue}p.inventory.splice(i,1);const key=pathKey(e.path);if(!room.paths.includes(key))room.paths.push(key);p.stats.sent++;p.stats.car++;if(!p.stats.paths.includes(key))p.stats.paths.push(key);p.inbox.unshift(`${key} 자동차 도달 성공`);room.log.unshift(`자동차 경로 완성: ${key}`);continue}const to=room.players.find(x=>x.id===plan.toId);if(!to)continue;p.inventory.splice(i,1);p.stats.sent++;to.stats.received++;to.inventory.push(e);to.inbox.unshift(`${energyLabel(e)} 1개를 익명으로 받음`)} }
export function energyLabel(e:Energy){if(e.type==='태양E')return'태양E 조각';if(e.type==='화학E'&&e.path.split('→').includes('화석연료'))return'화석연료 화학E';if(e.type==='화학E')return'식물 화학E';return e.type}
export function personalSuccess(p:Player){if(['식물','대기·바람','물순환'].includes(p.role))return p.stats.converted>=2;const expected:Record<string,string>={'화석연료':'화석연료 경로','태양광발전소':'태양광 경로','풍력발전소':'풍력 경로','수력발전소':'수력 경로','화력발전소':'화력 경로'};return p.stats.paths.includes(expected[p.role])}
export function scores(room:Room){const common=room.paths.length>=2;const guessedBy=new Map<string,{name:string;role:string;correct:boolean}[]>();for(const p of room.players){const[targetId,roleGuess]=p.guess?.split('|')||[];const target=room.players.find(x=>x.id===targetId);if(target){const list=guessedBy.get(targetId)||[];list.push({name:p.name,role:roleGuess,correct:target.role===roleGuess});guessedBy.set(targetId,list)}}return room.players.map(p=>{const[targetId,roleGuess]=p.guess?.split('|')||[];const target=room.players.find(x=>x.id===targetId);const correct=!!target&&target.role===roleGuess;const personal=personalSuccess(p);const named=(guessedBy.get(p.id)||[]).some(x=>x.correct);return{id:p.id,name:p.name,role:p.role,common,personal,guessCorrect:correct,revealed:named,guessedBy:guessedBy.get(p.id)||[],score:(common?0:-2)+(personal?3:0)+(correct?1:0)-(named?1:0)}})}
