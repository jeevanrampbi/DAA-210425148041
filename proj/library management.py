import csv
from math import floor

# Load books from CSV
books = []
with open("books.csv") as f:
    for row in csv.DictReader(f):
        books.append([int(row["id"]), row["title"], row["author"], row["available"] == "True"])

ids = [b[0] for b in books]

def interpolation_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high and target >= arr[low] and target <= arr[high]:
        if low == high:
            return low if arr[low] == target else -1
        pos = floor(low + (target - arr[low]) * (high - low) / (arr[high] - arr[low]))
        if arr[pos] == target:
            return pos
        elif arr[pos] < target:
            low = pos + 1
        else:
            high = pos - 1
    return -1

def search(bid):
    i = interpolation_search(ids, bid)
    if i == -1:
        print("Book not found.")
    else:
        b = books[i]
        print(f"ID: {b[0]} | Title: {b[1]} | Author: {b[2]} | {'Available' if b[3] else 'Issued'}")

def issue(bid):
    i = interpolation_search(ids, bid)
    if i == -1: print("Book not found.")
    elif not books[i][3]: print("Already issued.")
    else:
        books[i][3] = False
        print(f"'{books[i][1]}' issued.")

def return_book(bid):
    i = interpolation_search(ids, bid)
    if i == -1: print("Book not found.")
    elif books[i][3]: print("Book not issued.")
    else:
        books[i][3] = True
        print(f"'{books[i][1]}' returned.")

def display():
    print(f"\n{'ID':<6} {'Title':<30} {'Author':<15} Status")
    print("-" * 60)
    for b in books:
        print(f"{b[0]:<6} {b[1]:<30} {b[2]:<15} {'Available' if b[3] else 'Issued'}")

while True:
    print("\n1. Search  2. Issue  3. Return  4. Display  5. Exit")
    c = input("Choice: ")
    if c == "5": break
    if c in ("1","2","3"):
        bid = int(input("Book ID: "))
        if c == "1": search(bid)
        elif c == "2": issue(bid)
        elif c == "3": return_book(bid)
    elif c == "4": display()