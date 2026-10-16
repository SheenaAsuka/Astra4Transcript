from score_data_07 import *

# Enlarged PDF 3/4/10: four-note held Cm voicing and three-note Dm voicing.
for b in [10,18,38]:put('KR',b,S['KR'][b][0].replace('2:G4,Bb4,Eb5','2:G4,Bb4,C5,Eb5'))
for b in [11,19,39]:put('KR',b,S['KR'][b][0].replace('D5~,F5~,A5~','C5~,E5~,A5~'))
for b in [12,20,40]:put('KR',b,'1:C5,E5,A5')
put('KR',59,'1:C5~,E5~,A5~');put('KR',60,'1:C5,E5,A5')
put('V',22,S['V'][22][0].replace('16:D4~','16:D4'))
txt('V',22,'slur to next bar C4 (not a same-pitch tie)')
# Gt.-III parenthetical cues have two rearticulated sixteenths at beat 4.
for b in [41,42,43,44,45,47,49,51,53,55]:
    s=S['G3'][b][0]
    if s.endswith('8:/'):put('G3',b,s[:-3]+'16:/ 16:/')

# Source edition includes conditional notes; unfolded performance applies the passes.
for b in range(5,9):put('G2',b,S['G1'][b][0]);txt('G2',b,'2x only')
put('KL',10,'2:r 4:r 8:r 8:Bb4')
put('KL',11,'2:Bb5 2:r')
txt('KL',11,'2x only')

