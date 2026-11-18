"""每張自動平衡：保留整體調色，只把偏藍/偏紫/偏綠拉回容許範圍內。
量測：中性像素（低彩度、非膚色、非極暗極亮）的 a/b 平均 + 臉部膚色色相。
目標：中性 a≈1, b≈3；容許 b∈[0,7], a∈[-1,4]。超出才修，每張最多 b±7、a±5。"""
import cv2,numpy as np
TA,TB=1.0,3.0
def measure(im):
    lab=cv2.cvtColor(im.astype(np.float32)/255,cv2.COLOR_BGR2LAB)
    L,A,B=lab[...,0],lab[...,1],lab[...,2]
    h=np.degrees(np.arctan2(B,A));c=np.hypot(A,B)
    skin=(c>8)&(h>15)&(h<70)&(L>25)
    neu=(c<14)&(L>25)&(L<90)&~skin
    if neu.mean()<0.03: return None
    return float(A[neu].mean()),float(B[neu].mean()),float(neu.mean())
def balance(im):
    m=measure(im)
    if m is None: return im,(0,0,None)
    a,b,_=m
    db=0.0;da=0.0
    if b<0: db=min(TB-b,7)           # 太藍 → 拉暖
    elif b>9: db=max(TB+4-b,-5)      # 太黃 → 拉冷一點
    if a>4: da=max(TA-a,-5)          # 太紫/粉
    # 綠色不修（彩色衣服會誤判）
    if da==0 and db==0: return im,(0,0,m)
    lab=cv2.cvtColor(im.astype(np.float32)/255,cv2.COLOR_BGR2LAB)
    L=lab[...,0];w=np.clip((L-5)/20,0,1)*np.clip((100-L)/10,0,1)  # 深黑和高光少動
    lab[...,1]+=da*w*0.8;lab[...,2]+=db*w*0.8
    out=cv2.cvtColor(lab,cv2.COLOR_LAB2BGR)
    return np.clip(out*255+.5,0,255).astype(np.uint8),(round(da,1),round(db,1),m)
