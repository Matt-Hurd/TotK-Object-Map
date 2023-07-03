import json
import numpy as np

layers = ["sky", "surface"]

korok_mapping = {}

for layer in layers:
    
    with open(f"zd_{layer}.json") as f:
        zd_data = json.loads(f.read())

    korok_mapping[layer] = {}
    with open(f"data/layers/{layer}.json") as f:
        layer_data = json.loads(f.read())
    
    types = ["Npc_HiddenKorokFly", "Npc_HiddenKorokGround", "KorokCarry_Destination"]
    for korok_type in types:
        korok_mapping[layer][korok_type] = []
        for location in layer_data[korok_type]["locations"]:
            korok_location = np.array([location["x"], location["y"], location["z"]])
            closest = None
            closest_distance = 10000
            zd_koroks = zd_data[0]["markers"] if korok_type == 'KorokCarry_Destination' else zd_data[1]["markers"]
            for zd_korok in zd_koroks:
                zd_korok_location = np.array([zd_korok["coords"][0], zd_korok["coords"][1], zd_korok["elv"]])
                dist = np.linalg.norm(korok_location - zd_korok_location)
                if dist < closest_distance:
                    closest_distance = dist
                    closest = zd_korok
            korok_mapping[layer][korok_type].append(closest["id"])
print(korok_mapping)
