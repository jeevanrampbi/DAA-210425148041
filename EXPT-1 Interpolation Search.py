from math import floor


def interpolation_search(arr,target):
    low=0
    high=len(arr)-1
    while low<=high and target>=arr[low] and target<=arr[high]:
        if low==high:
            if arr[low]==target:
                return low
            else:
                return -1
        pos=(low+(target-arr[low])*(high-low))/(arr[high]-arr[low])
        pos=floor(pos)
        if arr[pos]==target:
            return pos
        elif arr[pos]<target:
            low=pos+1
        else:
            high=pos-1
    return -1

#example entities:
arr=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
target=13
print(interpolation_search(arr,target))
