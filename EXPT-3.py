import heapq
class UnionFind:
    def __init__(self,n):
        self.parent=list(range(n))
        self.rank=[0]*n
    def find(self,x):
        if self.parent[x]!=x:
            self.parent[x]=self.find(self.parent[x])
        return self.parent[x]
    def union(self,x,y):
        rootX=self.find(x)
        rootY=self.find(y)
        if rootX==rootY:
            return False
        if self.rank[rootX]<self.rank[rootY]:
            rootX,rootY=rootY,rootX
        self.parent[rootY]=rootX
        if self.rank[rootX]==self.rank[rootY]:
            self.rank[rootX]+=1
        return True

def kruskal(n,edges):
    edges.sort()
    uf=UnionFind(n)
    mst=[]
    totalCost=0
    for weight,u,v in edges:
        if uf.union(u,v):
            mst.append((u,v,weight))
            totalCost+=weight
            if len(mst)==n-1:
                break
    return mst,totalCost

def prim(n,graph,start=0):
    key=[float('inf')]*n
    parent=[-1]*n
    visited=[False]*n
    key[start]=0
    pq=[(0,start)]
    mst=[]
    totalCost=0
    while pq:
        weight,u=heapq.heappop(pq)
        if visited[u]:
            continue
        visited[u]=True
        if parent[u]!=-1:
            mst.append((parent[u],u,weight))
            totalCost+=weight
        for v,w in graph.get(u,[]):
            if not visited[v] and w<key[v]:
                key[v]=w
                parent[v]=u
                heapq.heappush(pq,(w,v))

    return mst,totalCost
n=7
edges=[
    (7,0,1),
    (5,0,3),
    (8,1,2),
    (9,1,3),
    (7,1,4),
    (5,2,4),
    (15,3,4),
    (6,3,5),
    (8,4,5),
    (9,4,6),
    (11,5,6)
]
graph={}
for weight,u,v in edges:
    graph.setdefault(u,[]).append((v,weight))
    graph.setdefault(v,[]).append((u,weight))
kruskalMST,kruskalCost=kruskal(n,edges[:])
primMST,primCost=prim(n,graph)
print("=== Kruskal's MST ===")
for u,v,w in kruskalMST:
    print(f"Edge ({u} - {v})  Weight: {w}")
print("Total MST Cost:",kruskalCost)
print("\n=== Prim's MST ===")
for u,v,w in primMST:
    print(f"Edge ({u} - {v})  Weight: {w}")
print("Total MST Cost:",primCost)