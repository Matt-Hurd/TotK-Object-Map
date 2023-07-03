import json
import requests

preamble = r'Size of this preview: <a href="'
preamble2 = r'<div class="fullImageLink" id="file"><a href="'
url = "https://www.zeldadungeon.net/wiki/File:"
base_url = "https://www.zeldadungeon.net"

with open("koroks.json", "r") as f:
    koroks = json.load(f)

for k, v in koroks.items():
    if "images" in v:
        for image_name in v["images"]:
            print(image_name)
            resp = requests.get(f"{url}{image_name}")
            if len(resp.text.split(preamble)) < 2:
                new_url = resp.text.split(preamble2)[1].split('"')[0]
            else:
                new_url = resp.text.split(preamble)[1].split('"')[0]

            img_data = requests.get(f"{base_url}{new_url}").content
            with open(f"assets/images/ZD/{image_name}", 'wb') as handler:
                handler.write(img_data)