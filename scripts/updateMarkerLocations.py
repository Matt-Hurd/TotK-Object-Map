import os
import json

directory = 'data/route'

oldLayers = {}
newLayers = {}

for layerName in ['cave', 'depths', 'sky', 'surface']:
    with open(f"data/layers/{layerName}.json") as f:
        newLayers[layerName] = json.load(f)

    with open(f"data/layers/{layerName} copy.json") as f:
        oldLayers[layerName] = json.load(f)

for filename in os.listdir(directory):
    f = os.path.join(directory, filename)
    if not os.path.isfile(f):
        continue

    with open(f) as routeFile:
        routeData = json.load(routeFile)
    print(f"Updating {f}")
    for sidx, segment in enumerate(routeData["segments"]):
        print(f"\t{segment['name']}")
        for pidx, point in enumerate(segment["points"]):
            objName = point["objName"]
            if objName not in newLayers[point["layer"]]:
                print(f"\t\tMissing {objName}")
                continue
            
            changed = False
            oldLocations = oldLayers[point["layer"]][objName]["locations"]
            newLocations = newLayers[point["layer"]][objName]["locations"]
            if len(newLocations) < point["locationIdx"] + 1:
                changed = True
            else:
                if oldLocations[point["locationIdx"]] != newLocations[point["locationIdx"]]:
                    changed = True
            
            if changed:
                newIdx = None
                oldLocation = oldLocations[point["locationIdx"]]
                for lidx, location in enumerate(newLocations):
                    if location == oldLocation:
                        newIdx = lidx
                        break
                routeData["segments"][sidx]["points"][pidx]["locationIdx"] = newIdx
                print(f"\t\t{objName} {point['locationIdx']} -> {newIdx}") 
    
    with open(f, "w") as outfile:
        outfile.write(json.dumps(routeData, indent=4))
