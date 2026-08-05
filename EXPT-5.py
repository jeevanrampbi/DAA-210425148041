def min_max_dc(arr,low,high):
    if low==high:
        return arr[low],arr[low]
    if high==low+1:
        if arr[low]<arr[high]:
            return arr[low],arr[high]
        else:
            return arr[high],arr[low]
    mid=(low+high)//2
    lmin,lmax=min_max_dc(arr,low,mid)
    rmin,rmax=min_max_dc(arr,mid+1,high)
    overall_min=min(lmin,rmin)
    overall_max=max(lmax,rmax)
    return overall_min,overall_max

arr=list(map(int,input().split()))
mn,mx=min_max_dc(arr,0,len(arr)-1)
print("Minimum:",mn)
print("Maximum:",mx)