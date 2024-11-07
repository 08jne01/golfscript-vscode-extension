import json
import sys

from matplotlib.font_manager import json_dump


def read_stdin():
    
    for line in sys.stdin:
        obj = json.loads(line)
        try:

            #result = callbacks[obj["type"]](obj["data"])
            #message = {
            #    "type" : obj["type"],
            #    "data" : result,
            #}
            print("HELLO")
            #sys.stdout.write(json.dumps(message) + '\n')
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(e)
            sys.stdout.flush()

    sys.stdin.flush()

exited = {
    "event" : "exited",
    "body" : {
        "exitcode" : 1,
    }
}

init = {
    "body" : {
        "error?": "OH NO"
    }
}

if __name__ == "__main__":
    quit = False

    x = input()

    s = json.dumps(init)

    while True:
        sys.stderr.write(s)
        sys.stderr.flush()