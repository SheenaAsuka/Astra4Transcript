import fs from 'node:fs';
import path from 'node:path';
import * as at from './alphatab/alphaTab.core.mjs';
const M=at.model;
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const input=JSON.parse(fs.readFileSync(path.join(root,'transcription_v1.json'),'utf8'));
const template=fs.readFileSync(path.join(root,'依存症_Intro4小节_试转.gp'));
const settings=new at.Settings();
const rest=()=>[{duration:1,dots:0,tuplet:null,notes:[],quarters:'4'}];
const copy=x=>JSON.parse(JSON.stringify(x));
const qval=x=>x.includes('/')?x.split('/').reduce((a,b)=>Number(a)/Number(b)):Number(x);
function pageOf(b){for(const [p,[a,z]]of Object.entries(input.pageRanges))if(b>=a&&b<=z)return Number(p);}
function event(duration,notes=[]){return {duration,dots:0,tuplet:null,notes,quarters:String(4/duration)}}
const tab=(f,s,tie=false)=>({fret:f,string:s,dead:false,tie,tech:[]});
function eventsFor(k,b,pass,unfolded){
  let vs=copy(input.staves[k][b]??{'0':rest()});
  if(k==='G2'&&b===11){vs['0'].at(-1).notes=[tab(2,4,true),tab(1,3,true),tab(0,2,true)];}
  if(unfolded){
    if(b>=5&&b<=8&&((k==='G1'&&pass===2)||(k==='G2'&&pass===1)))vs={'0':rest()};
    if(k==='KL'&&[10,11].includes(b)&&pass===1)vs={'0':rest()};
    if(b===11&&((k==='G1'&&pass===2)||(k==='G2'&&pass===1))){
      vs['0'][3].notes=[];vs['0'][4].notes=[];
    }
  }
  if(k==='KR'&&b===61){vs['1']=[event(4,vs['0'][0].notes),event(2),event(4)];vs['0'][0].notes=[];}
  return vs;
}
function build(unfolded){
  const score=at.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(template));
  score.title='依存症';score.subTitle=unfolded?'全曲转录 · 演奏顺序展开 · 含待核对项':'全曲转录 · 原谱结构 · 含待核对项';
  score.artist='';score.album='';score.music='';score.words='';score.copyright='';
  score.notices='唯一谱面依据：用户提供《依存症-总谱.pdf》，PDF 1–17 页。以已确认 Intro 4 小节 .gp 为模板。详见转录说明及待核对清单。120 BPM 为模板占位值。';
  score.tab='PDF transcription';
  score.masterBars=[];score.tracks=score.tracks.slice(0,6);
  const originalDrumArts=score.tracks[5].percussionArticulations;
  const definitions=[['Vo.',['V']],['Gt.-I',['G1']],['Gt.-II',['G2']],['Kb. (E.P. / Pf.)',['KR','KL']],['Ba.',['B']],['Dr.-I',['D1']],['Gt.-III',['G3']],['Dr.-II',['D2']],['Tambourine',['T']]];
  for(let i=6;i<9;i++){const t=new M.Track();t.ensureStaveCount(1);score.addTrack(t);}
  const order=unfolded?input.unfoldedOrder:Array.from({length:116},(_,i)=>i+1);
  const seen=new Map();const passes=order.map(b=>{const n=(seen.get(b)??0)+1;seen.set(b,n);return n});
  order.forEach((b,i)=>{
    const mb=new M.MasterBar();mb.timeSignatureNumerator=4;mb.timeSignatureDenominator=4;
    
    if(input.structure[b]){mb.section=new M.Section();mb.section.marker=input.structure[b];mb.section.text=input.structure[b]+(unfolded?` [谱 ${b}]`:'');}
    if(!unfolded){for(const [source,direction]of [[5,M.Direction.TargetSegno],[11,M.Direction.JumpDaCoda],[58,M.Direction.JumpDalSegnoAlCoda],[59,M.Direction.TargetCoda]])if(b===source)mb.addDirection(direction);}
    if(i===0){const a=M.Automation.buildTempoAutomation(false,0,120,2,false);a.text='原谱未标数值速度；120 仅为模板占位';mb.tempoAutomations.push(a);}
    score.addMasterBar(mb);
  });
  const channels=[[0,1],[2,3],[4,5],[6,7],[8,10],[9,9],[11,12],[9,9],[9,9]];
  const pending=[];
  definitions.forEach(([name,keys],ti)=>{
    const track=score.tracks[ti];track.name=name;track.shortName=name;track.isVisibleOnMultiTrack=true;
    track.playbackInfo.primaryChannel=channels[ti][0];track.playbackInfo.secondaryChannel=channels[ti][1];
    track.playbackInfo.isMute=false;track.playbackInfo.isSolo=false;track.systemsLayout=[];
    if(ti===6)track.playbackInfo.program=27;
    if([5,7,8].includes(ti)){track.playbackInfo.program=0;track.percussionArticulations=originalDrumArts;}
    keys.forEach((k,si)=>{
      const st=track.staves[si];st.bars=[];st.chords=null;st.showStandardNotation=true;
      const stringed=['G1','G2','G3','B'].includes(k),perc=['D1','D2','T'].includes(k);
      st.showTablature=stringed;st.isPercussion=perc;st.standardNotationLineCount=k==='T'?1:5;
      st.stringTuning.tunings=stringed?(k==='B'?[43,38,33,28]:[64,59,55,50,45,40]):[];
      st.transpositionPitch=0;st.displayTranspositionPitch=stringed?-12:0;
      const beatsByVoice=new Map();
      order.forEach((b,bi)=>{
        const bar=new M.Bar();bar.clef=(k==='B'||perc||(k==='KL'&&((b>=21&&b<=28)||b>=41)))?M.Clef.F4:M.Clef.G2;
        bar.keySignature=(b<=20||(b>=29&&b<=40)||(b>=59&&b<=60))?-2:0;st.addBar(bar);
        let vs=eventsFor(k,b,passes[bi],unfolded);if(['KR','D1','D2'].includes(k)&&!vs['1'])vs['1']=rest().map(e=>({...e,empty:true}));
        const annotations=[...(input.text[k]?.[b]??[])];
        if(k==='V')annotations.unshift(`PDF ${pageOf(b)} · 原谱 m.${b}${passes[bi]===2?' · 2x':''}`);
        if(k==='KR'&&b===1)annotations.push('E.P. / BPM 未标明，120 为模板占位');
        if(k==='KR'&&[21,41,61].includes(b))annotations.push('Pf.');
        if(k==='G1'&&b===5)annotations.push('1x only: m.5–8');
        if(k==='G2'&&b===5)annotations.push('2x only: m.5–8');
        if(k==='V'&&b===116)annotations.push('Cut Out');
        for(const [vstr,events]of Object.entries(vs)){
          const vi=Number(vstr);while(bar.voices.length<=vi)bar.addVoice(new M.Voice());
          const voice=bar.voices[vi];
          if(!beatsByVoice.has(vi))beatsByVoice.set(vi,[]);
          events.forEach((e,ei)=>{
            const beat=new M.Beat();beat.duration=e.duration;beat.dots=e.dots;
            if(e.tuplet){beat.tupletNumerator=e.tuplet[0];beat.tupletDenominator=e.tuplet[1];}
            beat.isEmpty=e.empty??false;voice.addBeat(beat);
            const techText=new Set();
            e.notes.forEach(nn=>{
              const note=new M.Note();
              if(stringed){note.string=st.tuning.length+1-nn.string;note.fret=nn.fret;note.isDead=nn.dead;}
              else if(perc){const art=track.percussionArticulations.findIndex(a=>a.id===nn.midi);if(art<0)throw Error('Unknown drum '+nn.midi);note.percussionArticulation=art;}
              else {note.octave=Math.floor(nn.midi/12);note.tone=nn.midi%12;}
              for(const tech of nn.tech??[]){
                if(tech==='h')note.isHammerPullOrigin=true;
                if(tech==='l')note.slideOutType=M.SlideOutType.Legato;
                if(tech==='s')note.slideOutType=M.SlideOutType.Shift;
                if(tech==='gi')note.slideInType=M.SlideInType.IntoFromBelow;
                if(tech==='go')note.slideOutType=M.SlideOutType.OutDown;
                if(tech==='v')note.vibrato=M.VibratoType.Slight;
                if(tech.startsWith('br'))techText.add('C.D. [幅度待核]');
                else if(tech.startsWith('b'))techText.add('cho. [幅度待核]');
                if(tech==='ph')techText.add('Picking Harm. [节点待核]');
              }
              beat.addNote(note);if(nn.tie)pending.push({note,beat,k,bi,vi,source:b});
            });
            if(vi===0&&ei===0&&annotations.length)techText.add(annotations.join(' | '));
            if(e.unknown)techText.add('待核对：此处音符未辨明');
            if(techText.size)beat.text=[...techText].join(' / ');
            if(k==='V'&&[15,22].includes(b)&&ei===events.length-1)beat.isLegatoOrigin=true;
            beatsByVoice.get(vi).push(beat);
          });
        }
      });
      for(const [vi,beats]of beatsByVoice)for(let n=0;n<beats.length-1;n++)beats[n]._nextSameVoice=beats[n+1];
    });
  });
  const tieProblems=[];
  for(const p of pending){
    let destBeat=p.beat._nextSameVoice;
    
    if(!unfolded&&p.k==='G2'&&p.source===11)continue;
    const n=p.note;
    const dst=destBeat?.notes.find(d=>d.string===n.string&&d.fret===n.fret&&d.tone===n.tone&&d.octave===n.octave&&d.percussionArticulation===n.percussionArticulation);
    if(dst){dst.isTieDestination=true;dst.tieOrigin=n;n.tieDestination=dst;}
    else tieProblems.push({staff:p.k,bar:p.source,voice:p.vi+1});
  }
  for(const t of score.tracks)for(const st of t.staves)for(const b of st.bars)for(const v of b.voices)for(const beat of v.beats)delete beat._nextSameVoice;
  score.finish(settings);
  if(tieProblems.length)throw Error('Unmatched ties: '+JSON.stringify(tieProblems));
  return {score,order,passes};
}

function signature(s){return s.tracks.map(t=>t.staves.map(st=>st.bars.map(b=>b.voices.filter(v=>!v.isEmpty).map(v=>v.beats.map(x=>({d:x.duration,dot:x.dots,tu:[x.tupletNumerator,x.tupletDenominator],n:x.notes.map(n=>({val:n.realValue,s:n.string,f:n.fret,dead:n.isDead,tie:n.isTieDestination})).sort((a,b)=>a.val-b.val||a.s-b.s)}))))));}
const reports=[];
for(const unfolded of [false,true]){
  const {score,order,passes}=build(unfolded);
  const bytes=new at.exporter.Gp7Exporter().export(score,settings);
  const imported=at.importer.ScoreLoader.loadScoreFromBytes(bytes,settings);
  const sigSame=JSON.stringify(signature(score))===JSON.stringify(signature(imported));
  if(!sigSame){const a=signature(score),b=signature(imported);let count=0;for(let t=0;t<a.length;t++)for(let st=0;st<a[t].length;st++)for(let bar=0;bar<a[t][st].length;bar++)if(JSON.stringify(a[t][st][bar])!==JSON.stringify(b[t]?.[st]?.[bar])){if(count++<5)console.log('DIFF',t,st,bar+1,JSON.stringify(a[t][st][bar]),JSON.stringify(b[t]?.[st]?.[bar]));}throw Error('Roundtrip mismatch '+count);}
  let voiceCount=0,noteCount=0;const errors=[];
  for(const t of imported.tracks)for(const st of t.staves){
    if(st.bars.length!==order.length)errors.push('track length');
    for(const b of st.bars)for(const v of b.voices){if(v.isEmpty)continue;voiceCount++;let sum=0;
      for(const beat of v.beats){let q=4/beat.duration*(2-1/2**beat.dots);if(beat.tupletNumerator>0&&beat.tupletDenominator>0)q*=beat.tupletDenominator/beat.tupletNumerator;sum+=q;noteCount+=beat.notes.length;}
      if(Math.abs(sum-4)>1e-7)errors.push({track:t.name,bar:b.index+1,voice:v.index,time:sum});
    }
  }
  if(errors.length)throw Error(JSON.stringify(errors));
  const name=unfolded?'依存症_全曲_演奏顺序展开_待核对.gp':'依存症_全曲_原谱结构_待核对.gp';
  fs.writeFileSync(path.join(root,name),bytes,{flag:'wx'});
  reports.push({file:name,bars:order.length,tracks:imported.tracks.map(t=>({name:t.name,staves:t.staves.length,bars:t.staves.map(st=>st.bars.length)})),voiceCount,noteCount,roundtripExact:sigSame,durationErrors:errors,sourceMapping:order.map((b,i)=>({bar:i+1,sourceBar:b,sourcePage:pageOf(b),pass:passes[i]})),directions:imported.masterBars.flatMap(m=>m.directions?[{bar:m.index+1,values:[...m.directions]}]:[])});
}
fs.writeFileSync(path.join(root,'validation_v1.json'),JSON.stringify(reports,null,2),{flag:'wx'});
console.log(JSON.stringify(reports.map(({file,bars,voiceCount,noteCount,roundtripExact,directions})=>({file,bars,voiceCount,noteCount,roundtripExact,directions})),null,2));
