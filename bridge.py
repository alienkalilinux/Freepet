import sys

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    x = int(data[1])
    y = int(data[2])

    d = abs(x) + abs(y)
    if n < d or (n - d) % 2 != 0:
        print(-1)
        return

    k = (n - d) // 2
    pts = []

    if x != 0:
        sx = 1 if x > 0 else -1
        X = abs(x)
        if k == 0:
            for c in range(X + 1):
                pts.append((c, 0))
        else:
            s = -1 if y > 0 else 1
            pts.append((0, 0))
            for j in range(1, k + 1):
                pts.append((0, s * j))
            for j in range(k, -1, -1):
                pts.append((1, s * j))
            for c in range(2, X + 1):
                pts.append((c, 0))
        vy = 1 if y > 0 else -1
        for j in range(1, abs(y) + 1):
            pts.append((X, vy * j))
        if sx == -1:
            pts = [(-a, b) for a, b in pts]
    else:
        sy = 1 if y > 0 else -1
        Y = abs(y)
        if k == 0:
            for j in range(Y + 1):
                pts.append((0, sy * j))
        else:
            pts.append((0, 0))
            for j in range(1, k + 1):
                pts.append((j, 0))
            for j in range(k, -1, -1):
                pts.append((j, sy))
            for j in range(2, Y + 1):
                pts.append((0, sy * j))

    sys.stdout.write('\n'.join(f'{a} {b}' for a, b in pts) + '\n')

main()
