def NAIVE_SEARCH(text,pattern):
 n=len(text)
 m=len(pattern)
 ans=[]
 for i in range(n-m+1):
  if text[i:i+m]==pattern:
   ans.append(i)
 return ans

def KMP_FAILURE_FUNCTION(pattern):
 m=len(pattern)
 lps=[0]*m
 length=0
 i=1
 while i<m:
  if pattern[i]==pattern[length]:
   length+=1
   lps[i]=length
   i+=1
  elif length!=0:
   length=lps[length-1]
  else:
   lps[i]=0
   i+=1
 return lps

def KMP_SEARCH(text,pattern):
 n=len(text)
 m=len(pattern)
 lps=KMP_FAILURE_FUNCTION(pattern)
 ans=[]
 i=0
 j=0
 while i<n:
  if pattern[j]==text[i]:
   i+=1
   j+=1
  if j==m:
   ans.append(i-j)
   j=lps[j-1]
  elif i<n and pattern[j]!=text[i]:
   if j!=0:
    j=lps[j-1]
   else:
    i+=1
 return ans

def RABIN_KARP(text,pattern,q=101):
 d=256
 n=len(text)
 m=len(pattern)
 h=pow(d,m-1,q)
 patternHash=0
 textHash=0
 ans=[]
 for i in range(m):
  patternHash=(d*patternHash+ord(pattern[i]))%q
  textHash=(d*textHash+ord(text[i]))%q
 for s in range(n-m+1):
  if patternHash==textHash and text[s:s+m]==pattern:
   ans.append(s)
  if s<n-m:
   textHash=(d*(textHash-ord(text[s])*h)+ord(text[s+m]))%q
   if textHash<0:
    textHash+=q
 return ans

text="ABABDABACDABABCABAB"
pattern="ABABCABAB"
print("text=",text)
print("pattern=",pattern)
print("Naive Search:",NAIVE_SEARCH(text,pattern))
print("KMP Search:",KMP_SEARCH(text,pattern))
print("Rabin-Karp Search:",RABIN_KARP(text,pattern))