import requests
import time
import datetime
import csv

servers = requests.get("https://dev.krew.io/get_servers").json()
unix_timestamp = time.time()
timestamp = datetime.datetime.fromtimestamp(unix_timestamp).strftime('%Y-%m-%d %H:%M:%S')

csv_row = [timestamp]
for number, server_id in enumerate(servers, start=1):
    csv_row.append(servers.get(server_id).get('playerCount'))

with open('/root/booty/logs/statistics.csv', 'a') as csvFile:
    writer = csv.writer(csvFile)
    writer.writerow(csv_row)
csvFile.close()
