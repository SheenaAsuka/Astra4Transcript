from score_data_08 import *
import json
from pathlib import Path

root=Path(__file__).parent
def source_page(b):
    return next(p for p,(a,z) in PAGE_RANGES.items() if a<=b<=z)
issues=[]
for t,bars in S.items():
    for b,voices in bars.items():
        for v,dsl in voices.items():
            events=parse(dsl)
            total=sum((Fraction(e['quarters']) for e in events),Fraction())
            assert total==4,(t,b,v,total)
            for i,e in enumerate(events):
                strings=[n['string'] for n in e['notes'] if 'string' in n]
                assert len(set(strings))==len(strings),(t,b,i,strings)
                uncertain=[]
                for n in e['notes']:
                    for tech in n['tech']:
                        if tech.startswith('b'):uncertain.append('推弦/回落幅度与曲线待核；保留 cho./C.D. 标记，不设猜测的播放音程')
                        elif tech=='ph':uncertain.append('Picking Harm. 节点未明确；保留文字，不设猜测的泛音音高')
                if uncertain:
                    issues.append({'page':source_page(b),'bar':b,'staff':t,'voice':v+1,'event':i+1,'detail':'；'.join(sorted(set(uncertain)))})

meta=[
 {'page':1,'bar':1,'staff':'ALL','detail':'原谱未见数值 BPM；120 为已确认模板的播放占位值，不是确认的曲速。'},
 {'page':3,'bar':14,'staff':'Kb.','detail':'早段上谱表 E.P. 与下谱表 Pf. 同时出现；保留双谱表和音色文字，GP 单键盘轨音色切换不能逐谱表独立播放。'},
 {'page':6,'bar':33,'staff':'Dr.-II','detail':'Rim Shot with Delay 的延迟时间、反馈和湿度未给出，仅录入击鼓音与文字。'},
 {'page':7,'bar':41,'staff':'Gt.-III','detail':'括号内补记声部已拆轨；其按整小节压缩排版的起止对齐仍建议人工核对。'},
 {'page':10,'bar':60,'staff':'Kb.','detail':'原谱长音、// 中断与 Pf. 弱起重叠；用第二声部保留弱起，具体释音点待核。'},
 {'page':10,'bar':61,'staff':'Tambourine','detail':'按十六分音符 simile 展开至 Cut Out；原谱未另列停止点，延续范围待人工复核。'},
 {'page':11,'bar':69,'staff':'Gt.-I','detail':'69–116 小节独奏中的装饰音、推弦保持/回落边界需复核；目前以主音符、TAB 与技法文字记录。'},
 {'page':13,'bar':85,'staff':'Kb.','detail':'后段按原谱四小节重复记号展开。原谱第 1 页已说明部分内声省略，没有补写未印出的音。'},
 {'page':17,'bar':116,'staff':'ALL','detail':'Cut Out 保留文字与曲终；未添加渐弱或推测的尾音。'}
]
data={
 'sourceTitle':'依存症','sourcePages':17,'barCount':116,
 'pageRanges':PAGE_RANGES,'staves':{t:{str(b):{str(v):parse(dsl) for v,dsl in vs.items()} for b,vs in bars.items()} for t,bars in S.items()},
 'text':TEXT,'issues':meta+issues,
 'structure':{1:'Intro',5:'A / Segno',13:'B',21:'C',29:'D',33:'E',41:'F',59:'Coda',61:'G',116:'Cut Out'},
 'unfoldedOrder':list(range(1,59))+list(range(5,12))+list(range(59,117)),
 'checks':{'explicitVoices':sum(len(vs) for bars in S.values() for vs in bars.values()),'durationErrors':0,'duplicateStrings':0},
}
dest=root/'transcription_v1.json'
with dest.open('x',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False,indent=2)
print(json.dumps({'bars':116,'unfoldedBars':len(data['unfoldedOrder']),'issues':len(data['issues']),'checks':data['checks']},ensure_ascii=False))
