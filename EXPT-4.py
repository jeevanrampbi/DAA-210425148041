import heapq
def dijkstra(graph,source):
    n=len(graph)
    dist=[float('inf')]*n
    prev=[None]*n
    visited=set()
    dist[source]=0
    pq=[(0,source)]
    while pq:
        d,u=heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        for v,w in graph[u]:
            if dist[u]+w<dist[v]:
                dist[v]=dist[u]+w
                prev[v]=u
                heapq.heappush(pq,(dist[v],v))
    return dist,prev
def reconstruct_path(prev,source,target):
    path=[]
    node=target
    while node is not None:
        path.append(node)
        node=prev[node]
    path.reverse()
    if path and path[0]==source:
        return path
    return []
graph={
    0:[(1,4),(2,1)],
    1:[(3,1)],
    2:[(1,2),(3,5)],
    3:[(4,3)],
    4:[(5,2)],
    5:[]
}
source=0
dist,prev=dijkstra(graph,source)
print("Shortest paths from vertex",source)
print(f'{"Vertex":>8} {"Distance":>10} {"Path":>30}')
print("-"*55)
for v in range(len(graph)):
    path=reconstruct_path(prev,source,v)
    pathStr=" -> ".join(map(str,path)) if path else "No path"
    distance=dist[v] if dist[v]!=float('inf') else "INF"
    print(f'{v:>8} {str(distance):>10} {pathStr:>30}')