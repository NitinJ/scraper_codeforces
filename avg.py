import sys

def avg(filename):
    f = open(filename, 'r')
    total = 0
    n = 0
    failed = 0
    for line in f:
        try:
            time = map(int, line.split(",")[0].split(":"))
            if time[0] >= 2:
                failed += 1
                raise
            total += time[0]*3600 + time[1]*60 + time[2]
            n += 1
        except:
            pass
    if n == 0:
        return 0,n,failed
    a = total/n
    return int(a/60),n,failed

if __name__=="__main__":
    if len(sys.argv) < 3:
        print "avg.py Div1/Div2 A/B/C/D/E"
    div = sys.argv[1]
    q = sys.argv[2]
    filename = "data/"+div+"_"+q
    average,success,failed = avg(filename)
    print "Average time = ", average, "minutes @", success, "successful questions"
    print "Failure rate = ", str(failed*100/(failed+success))+"% @", failed, "failed questions"
