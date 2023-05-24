window.addEventListener('load', (event) => {
    var map = L.map('totk-map', {
        preferCanvas: true,
        minZoom: -4,
        maxZoom: 4,
        center: [0, 0],
        zoom: -4,
        cursor: true,
        crs: L.CRS.Simple,
    });

    let groups = [];
    let activeType = '';
    let routes = [];
    let activeRoute = '';
    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let colors = {
        'sky': 'blue',
        'surface': 'green',
        'depths': 'red'
    }
    let bounds = new L.LatLngBounds(leftBottom, topRight);
    map.setMaxBounds(bounds);

    let skyOverlay = L.imageOverlay('images/maps/sky.jpg', bounds);
    let surfaceOverlay = L.imageOverlay('images/maps/surface.jpg', bounds);
    let caveOverlay = L.imageOverlay('images/maps/surface.jpg', bounds);
    let depthsOverlay = L.imageOverlay('images/maps/depths.jpg', bounds);

    jQuery('#showSky').click(function () {
        if (activeType === 'sky') {
            return;
        }

        skyOverlay.addTo(map);
        map.removeLayer(surfaceOverlay);
        map.removeLayer(caveOverlay);
        map.removeLayer(depthsOverlay);

        activateType('sky');
    });

    jQuery('#showSurface').click(function () {
        if (activeType === 'surface') {
            return;
        }

        map.removeLayer(skyOverlay);
        surfaceOverlay.addTo(map);
        map.removeLayer(caveOverlay);
        map.removeLayer(depthsOverlay);

        activateType('surface');
    }).trigger('click');

    jQuery('#showCave').click(function () {
        if (activeType === 'cave') {
            return;
        }

        map.removeLayer(skyOverlay);
        map.removeLayer(surfaceOverlay);
        caveOverlay.addTo(map);
        map.removeLayer(depthsOverlay);

        activateType('cave');
    });

    jQuery('#showDepths').click(function () {
        if (activeType === 'depths') {
            return;
        }

        map.removeLayer(skyOverlay);
        map.removeLayer(surfaceOverlay);
        map.removeLayer(caveOverlay);
        depthsOverlay.addTo(map);

        activateType('depths');
    });

    function activateType(type) {
        activeType = type;

        resetAll();

        jQuery('#itemFilters div:not(.' + activeType + ')').hide();
        jQuery('#itemFilters div.' + activeType).show();
    }

    jQuery('#showAllDungeons').click(function () {
        if (activeRoute === 'allDungeons') {
            return;
        }

        activateRoute('allDungeons');
    });

    jQuery('#showNone').click(function () {
        if (activeRoute !== '') {
            map.removeLayer(routes[activeRoute].layerGroup)
        }
        activeRoute = ''
    });
    

    function activateRoute(route) {
        if (activeRoute === route) {
            return;
        }
        if (routes[route]) {
            map.removeLayer(routes[route].layerGroup)
        }

        activeRoute = route;

        if (routes[route]) {
            routes[route].layerGroup.addTo(map);
        } else {
            routes[route] = []
            routes[route].layerGroup = L.layerGroup();
            segments = new Array();
            currentSegment = new Array();
            previousPoint = [];
            point = null;
            jQuery.getJSON("data/route/" + route + ".json", function (data) {
                Object.entries(data).forEach(function (group, index) {
                    relevantObject = groups[group[1].layer][group[1].objName];
                    point = relevantObject.locations[group[1].locationIdx];
                    if (group[1].teleport === true) {
                        segments.push(currentSegment)
                        currentSegment = new Array();
                    }
                    currentSegment.push([point.x, point.y]);
                    marker = new L.Marker([point.x, point.y], {icon: L.ExtraMarkers.icon({icon: 'fa-number', markerColor: colors[group[1].layer], number: index + 1})})
                    routes[route].layerGroup.addLayer(marker);
                });
                currentSegment.push([point.x, point.y]);
                segments.push(currentSegment);
                segments.forEach(function(segment, index) {
                    polyline = L.polyline(segment, {color: 'white'})
                    decorator = L.polylineDecorator(segment, {
                        patterns: [
                            {offset: 25, repeat: 150, symbol: L.Symbol.arrowHead({pixelSize: 20, pathOptions: {fillOpacity: 1, weight: 0}})}
                        ]
                    })
                    routes[route].layerGroup.addLayer(polyline);
                    routes[route].layerGroup.addLayer(decorator);
                    if (index > 0) {
                        dottedSegment = [segments[index - 1].pop(), segments[index][0]];
                        dots = L.polylineDecorator(dottedSegment, {
                            patterns: [
                                {offset: 0, repeat: 5, symbol: L.Symbol.dash({pixelSize: 0, pathOptions: {fillOpacity: 1, weight: 2}})},
                                {offset: 25, repeat: 150, symbol: L.Symbol.arrowHead({pixelSize: 20, pathOptions: {fillOpacity: 1, weight: 0}})}
                            ]
                        })
                        routes[route].layerGroup.addLayer(dots);
                    }
                });
            });
            routes[route].layerGroup.addTo(map);
        }
    }

    function parseData(type, data) {
        groups[type] = data;

        Object.entries(data).forEach(function (group, index) {
            let displayName = group[1].name;

            if (displayName && displayName.length > 0) {
                displayName += '<span class="smaller-name">';
                displayName += ' - ';
            }

            let searchName = group[1].name + " " + group[0];

            displayName += group[0];
            displayName += '</span>';

            jQuery('#itemFilters .' + type).append('<label><input type="checkbox" value="' + group[0] + '" data-search-value="' + searchName + '">' + displayName + '</label>');
        });

        jQuery(document).on('change', '#itemFilters .' + type + ' input', function (e) {
            let val = jQuery(this).val();

            if (groups[type][val].markers) {
                if (this.checked === false) {
                    map.removeLayer(groups[type][val].markers);
                } else {
                    map.addLayer(groups[type][val].markers);
                }
            } else {
                loadVal(type, val)
            }
        });
    }

    function loadVal(type, val) {
        if (!groups[type][val].markers) {
            groups[type][val].markers = L.markerClusterGroup({
                removeOutsideVisibleBounds: true,
                spiderfyOnMaxZoom: false,
                disableClusteringAtZoom: 0,
                animate: false,
                maxClusterRadius: 20,
                iconCreateFunction: function (cluster) {
                    return L.divIcon({
                        html: cluster.getChildCount(),
                        className: 'big-marker',
                        iconSize: [18, 18],
                    });
                }
            });

            let displayName = groups[type][val].name

            if (displayName && displayName.length > 0) {
                displayName += '<span class="smaller-name">';
            }

            displayName += val;
            displayName += '</span>';

            let iconsHtml = '';
            if (groups[type][val].icons.length > 0) {
                iconsHtml += "<div class='totk-marker-icons'>";

                groups[type][val].icons.forEach(function (icon, index) {
                    let fileEnd = 'png';
                    if (icon.includes('_Icon')) {
                        fileEnd = 'jpg';
                    }

                    iconsHtml += "<img src='images/icons/" + icon + "." + fileEnd + "' alt='" + icon + "'>"
                });

                iconsHtml += "</div>";
            }

            groups[type][val].locations.forEach(function (point, index) {
                let marker = L.circleMarker([point.x, point.y], {
                    title: point.z + ' - ' + val,
                    radius: 3
                });

                let popup =
                    "<div class='totk-marker'>" +
                    "   <h2>" + displayName + "</h2>" +
                    "   <div class='content'>" +
                    "       <div class='totk-marker-meta'>" +
                    "          <span><strong>X: </strong>" + point.y + "</span>" +
                    "          <span><strong>Y: </strong>" + point.x + "</span>" +
                    "          <span><strong>Z: </strong>" + point.z + "</span>" +
                    "       </div>" +
                    iconsHtml +
                    "   </div>" +
                    "</div>";

                marker.bindPopup(
                    popup
                );

                groups[type][val].markers.addLayer(marker);
            });

            groups[type][val].markers.addTo(map);
        }
    }

    jQuery('#filter-search input[type=search]').on('keyup', function () {
        if (this.value.length === 0) {
            jQuery('#itemFilters .' + activeType + ' label').show();
            return;
        }

        jQuery('#itemFilters .' + activeType + ' input[data-search-value*="' + this.value + '" i]').parent().show();
        jQuery('#itemFilters .' + activeType + ' input:not([data-search-value*="' + this.value + '" i])').parent().hide();
    });

    function resetAll() {
        jQuery('#itemFilters input:checked').trigger('click');
    }

    jQuery('#resetAll').click(resetAll);

    jQuery('#showAll').click(function () {
        jQuery('#itemFilters input:not(:checked):visible').trigger('click');
    });

    jQuery('#hideAll').click(function () {
        jQuery('#itemFilters input:checked:visible').trigger('click');
    });

    ["cave", "depths", "sky", "surface"].forEach((type) => {
        jQuery.getJSON("data/layers/" + type + ".json", function (data) {
            parseData(type, data);
        });
    });
});
