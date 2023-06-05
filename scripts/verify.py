import os
import json

with open('data/route/hundo.json') as routeFile:
    routeData = json.load(routeFile)
    markers = {}
    for markerKey, markerValue in routeData["enabledMarkers"].items():
        markers[markerKey] = {
            'names': [objName for objName in markerValue["objNames"]],
            'set': set()
        }

    for segment in routeData["segments"]:
        for point in segment["points"]:
            for key, marker in markers.items():
                if point["objName"] in marker["names"]:
                    marker["set"].add((point["objName"], point["locationIdx"], point["layer"]))
    
    for key, value in markers.items():
        print(key, len(value['set']))