import json

with open("zd_koroks.json") as zdd:
    zd_koroks = json.loads(zdd.read())

with open("map_to_zd.json") as mtozdd:
    map_to_zd = json.loads(mtozdd.read())

for layer in map_to_zd.keys():
    for korok_type in map_to_zd[layer].keys():
        for x, value in enumerate(map_to_zd[layer][korok_type]):
            print(value)
            map_to_zd[layer][korok_type][x] = zd_koroks[value]

with open("merged_koroks.json", "w") as f:
    json.dump(map_to_zd, f)
