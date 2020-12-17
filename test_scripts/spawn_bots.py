import requests
import socketio
import time

servers = requests.get("http://localhost:8000/get_servers").json()
server = list(servers.keys())[0]
sio = socketio.Client()


@sio.event
def connect():
    # create a bot player
    sio.emit("createPIayer", {"boatId": None, "token": None, "spawn": ""})
    # response = sio.emit("createPlayer", {"socketId": "ysg3"})
    # print(response)
    print('connection established')
    # time.sleep(1)

    # buy 1 coffee
    # sio.emit("buy-goods", {"quantity": 1, "action": "buy", "good": "coffee"})
    # print('bought 1 coffee')

    # # let the bot player join a krew
    # sio.emit("joinKrew", "84z9")
    # print('JOINED!')

    # # boot a member on the boat
    # sio.emit("bootMember", "0KjR")
    # print('Member booted')

    # # let the bot player buy a raft
    # sio.emit("purchase", {"type": 0, "id": "1"})
    # print('purchased raft')
    # time.sleep(1)
    #
    # # let the bot player depart land
    # sio.emit("departure", 0)
    # print('SAIL!')


@sio.event
def my_message(data):
    print('message received with ', data)
    sio.emit('my response', {'response': 'my response'})


@sio.event
def disconnect():
    print('disconnected from server')


# sio.connect("http://" + server['ip'] + ":" + server['port'])
sio.connect("http://localhost:2001")
# sio.wait()
time.sleep(60)
sio.disconnect()

# Maybe possible to give socket ID when connecting? --> {socketId: "ysg3"}
