"""Source transcription data. Scientific pitch; TAB uses conventional high-to-low strings."""
from fractions import Fraction
from copy import deepcopy
import re

S = {k:{} for k in ['V','G1','G2','KR','KL','B','D1','G3','D2','T']}
PAT = {}
TEXT = {}
ISSUES = []
CHORDS = {}
PAGE_RANGES = {2:(1,8),3:(9,16),4:(17,24),5:(25,32),6:(33,40),7:(41,46),8:(47,52),9:(53,58),10:(59,66),11:(67,74),12:(75,82),13:(83,89),14:(90,97),15:(98,103),16:(104,109),17:(110,116)}

def put(track,bar,dsl,voice=0):
    if isinstance(bar,(list,range,tuple)):
        for b in bar:put(track,b,dsl,voice)
        return
    if dsl in PAT:dsl=PAT[dsl]
    S[track].setdefault(bar,{})[voice]=dsl

def cp(track,src,dst):
    if isinstance(dst,(list,range,tuple)):
        for b in dst:cp(track,src,b)
    else:S[track][dst]=deepcopy(S[track].get(src,{0:'1:r'}))

def txt(track,bar,text):TEXT.setdefault(track,{}).setdefault(bar,[]).append(text)

def pattern(name,dsl):PAT[name]=dsl;return dsl

def chord(bar,*pairs):CHORDS[bar]=list(pairs)

# Rhythms: denominator, optional dot, optional tN/M; note suffix '~' begins a tie.
# !h hammer/pull, !s shift slide, !l legato slide, !v vibrato, !b1/!b2 bend
# !gi/!go glissando into/out, !ph pinch harmonic. '?' is explicitly unresolved.
def parse(dsl):
    result=[];last=[]
    for tok in dsl.split():
        dur,ns=tok.split(':',1)
        m=re.fullmatch(r'(\d+)(\.*)(?:t(\d+)/(\d+))?',dur)
        if not m:raise ValueError(tok)
        den=int(m[1]);dots=len(m[2]);tuplet=[int(m[3]),int(m[4])] if m[3] else None
        ticks=Fraction(4,den)*sum((Fraction(1,2)**i for i in range(dots+1)),Fraction())
        if tuplet:ticks*=Fraction(tuplet[1],tuplet[0])
        notes=[]
        if ns=='/':notes=deepcopy(last)
        elif ns not in ['r','?']:
            for atom in ns.split(','):
                parts=atom.split('!');a=parts[0];tie=a.endswith('~');a=a.rstrip('~')
                n={'tie':tie,'tech':parts[1:]}
                if '@' in a:
                    f,st=a.split('@');n.update(fret=0 if f=='x' else int(f),string=int(st),dead=f=='x')
                elif a.isdigit():n['midi']=int(a)
                else:
                    pm=re.fullmatch(r'([A-G])([b#]?)(-?\d+)',a)
                    if not pm:raise ValueError(atom)
                    n['midi']=(int(pm[3])+1)*12+{'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}[pm[1]]+({'b':-1,'#':1}.get(pm[2],0))
                    n['pitch']=a
                notes.append(n)
        if notes:last=deepcopy(notes)
        result.append({'duration':den,'dots':dots,'tuplet':tuplet,'notes':notes,'unknown':ns=='?','quarters':str(ticks)})
    return result

# PDF 2: Intro and A. The confirmed template's pitches/rhythms are preserved.
pattern('arpBb','8:1@5 8:2@3 8:3@4 8:3@3~ 2:3@3')
pattern('arpF','8:2@3 8:3@4 8:3@5 8:3@3~ 2:3@3')
pattern('epBb','4.:Bb4,D5,F5,A5 8:G4~,Bb4~,D5~,F5~ 2:G4,Bb4,D5,F5')
pattern('epF','4.:C5,Eb5,F5,A5 8:F4~,C5~,F5~ 2:F4,C5,F5')
for b in [1,3,5,7,13,15,29,31,33,35]:
    put('G1',b,'arpBb');put('KR',b,'epBb')
for b in [2,4,6,8,14,16,30,32,34,36]:
    put('G1',b,'arpF');put('KR',b,'epF')
put('V',5,'8:r 8:A4 8:A4 16:F4 16:F4 16:F4 16:F4 16:D4 16:D4 8:D4 8:Bb3')
put('V',[6,8,14,34,36],'8.:Eb4 16:F4~ 4:F4 2:r')
put('V',7,'8:r 8:A4 8:A4 16:F4 16:F4 8:F4 16:D4 16:D4 8:D4 8:Bb3')
txt('G1',5,'1x only (PDF 2)');txt('G2',5,'2x only (PDF 2): first pass rests; second pass Intro arpeggio')

# PDF 3, source bars 9-16.
put('V',9,'16:C4 16:D4 8:Eb4 16:F4 16:G4 16:G4 16:Ab4 16:G4 8:F4 16:Eb4 4:D4')
put('V',10,'16:Bb3 16:C4 8:D4 16:Eb4 8:F4 16:G4 16:F4 8:Eb4 16:D4 4:Bb3')
put('V',11,'4:r 8:C4 8:D4 8:E4 8:r 8:F4 8:E4~')
put('V',12,'1:E4')
pattern('gFm','4:1@3,4@2 4:/ 8:1@5 4:3@3 8:3@5~,5@4~,3@3~,4@2~')
put('G1',[9,17],'gFm')
put('G1',10,'4:3@5,5@4,3@3,4@2 4:5@4,3@3,3@2 8:3@5 4:5@4,3@3,3@2 8:3@5')
put('G1',11,'4:3@6 4:3@3,3@2 8:0@6 4:0@3,0@2 8:0@4~,2@3~,1@2~')
put('G1',12,'1:0@4,2@3,1@2')
put('G2',9,'4:3@4 4:1@3 8:1@5 4:1@3 8:3@5~')
put('G2',10,'8:3@5 8:3@3 4:4@2 4:3@2 4:3@3')
put('G2',11,'4:3@6 4:3@3 8:0@6 4:0@3 8:r')
txt('G1',11,'1x only from C7(on E)');txt('G2',11,'2x only: final chord 2@4,1@3,0@2 ties into Coda')
pattern('epFm','2:C5,F5,Ab5 4.:Bb4,C5,D5,F5 8:Bb4~,C5~,D5~,F5~,G5~')
pattern('epCm','4.:Bb4,C5,D5,F5,G5 8:G4~,Bb4~,C5~,D5~ 2:G4,Bb4,D5')
pattern('epGm','2:Bb4,D5,G5 4.:G4,Bb4,D5,E5 8:D5~,F5~,A5~')
for b in [9,17,37]:put('KR',b,'epFm')
for b in [10,18,38]:put('KR',b,'epCm')
for b in [11,19,39]:put('KR',b,'epGm')
put('KR',[12,20,40],'1:D5,F5,A5')
txt('KL',10,'2x only: last eighth B4; next bar 11 Bb5 half, half rest')
put('V',13,'8:r 8:A4 8:A4 16:F4 16:F4 8:F4 16:D4 16:D4 8:D4 8:Bb3')
put('V',15,'8:r 8:A4 8:A4 16:F4 16:F4 8:F4 16:D4 16:D4 4:D4~')
put('V',16,'2:F4 2:r')
pattern('pfFill','2:r 4:r 16:Eb5 16:Bb5 16:Eb6 16:G6')
put('KL',[14,16,34,36],'pfFill');put('KL',15,'1:G6,A6')
pattern('bassBb','4.:6@3,5@2 8:3@3~,1@2~ 2:3@3,1@2')
pattern('bassF','8:3@3,3@1!h 4:5@2 8:3@3~,3@2~ 2:1@3,3@2')
put('B',[13,15,33,35],'bassBb');put('B',[14,16,34,36],'bassF')
txt('B',13,'PDF note 1: pluck the two-note chord with thumb and index; balance the two notes')
# Dr. II: two independent rhythmic voices retained.
put('D2',12,'4:r 8:r 32:38 32:48 16:r 16:45 8:45 8:38 8:46')
put('D2',12,'2:r 4:r 16:r 8.:36',1)
pattern('d2a','8:42 8:42 8:42,38 8:42 8:42 8:42 16:42,38 16:42 8:42')
pattern('d2b','8:42 8:42 16:42,38 16:42 8:42 8:42 8:42 16:42,38 16:42 8:42')
pattern('kickA','4:36 4:r 8:36 8:36 4:r')
for b in [13,15]:put('D2',b,'d2a');put('D2',b,'kickA',1)
for b in [14,16]:put('D2',b,'d2b');put('D2',b,'kickA',1)

# All source rests are represented explicitly when exporting; no continuation is inferred.
