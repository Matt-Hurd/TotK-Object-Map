window.addEventListener('load', () => {
    var map = L.map('totk-map', {
        preferCanvas: true,
        minZoom: -4,
        maxZoom: 4,
        center: [0, 0],
        zoom: -4,
        cursor: true,
        crs: L.CRS.Simple,
    });

    var cursorMarker = L.marker();

    function updateLocations() {
        if (activeLayer !== 'surface') {
            map.removeLayer(zoomLayer1);
            map.removeLayer(zoomLayer2);
            return;
        }

        switch (map.getZoom()) {
            case -4:
            case -3:
                map.addLayer(zoomLayer1);
                map.removeLayer(zoomLayer2);
                break;
            case -2:
            case -1:
                map.removeLayer(zoomLayer1);
                map.addLayer(zoomLayer2);
                break;
        }
    }

    map.on('zoom', updateLocations)

    // map.on('click', function (e) {
    //     cursorMarker
    //         .setLatLng(e.latlng)
    //         .bindPopup(
    //             "<div class='totk-marker'>" +
    //             "   <h2>Marker Positon</h2>" +
    //             "   <div class='content'>" +
    //             "       <div class='totk-marker-meta'>" +
    //             "          <span><strong>X: </strong>" + e.latlng.lng + "</span>" +
    //             "          <span><strong>Y: </strong>" + e.latlng.lat + "</span>" +
    //             "       </div>" +
    //             "   </div>" +
    //             "</div>"
    //         )
    //         .openPopup()
    //         .addTo(map);
    // });

    window.lastIconClass = -1;

    let layers = [];
    let activeLayer = '';
    let routes = [];
    let activeRoute = '';
    let draggedPointIdx = -1;
    let draggedSegmentIdx = -1;
    let colors = {
        'sky': 'blue',
        'surface': 'green',
        'depths': 'red'
    }
    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let bounds = new L.LatLngBounds(leftBottom, topRight);
    map.setMaxBounds(bounds);

    let skyLayerBackgroundImage = L.imageOverlay('assets/images/maps/sky.jpg', bounds);
    let surfaceLayerBackgroundImage = L.imageOverlay('assets/images/maps/surface.jpg', bounds);
    let caveLayerBackgroundImage = L.imageOverlay('assets/images/maps/surface.jpg', bounds);
    let depthsLayerBackgroundImage = L.imageOverlay('assets/images/maps/depths.jpg', bounds);

    let allMarkerLayers = [];

    let zoomLayer1 = L.layerGroup();
    let zoomLayer2 = L.layerGroup();

    jQuery('#show-layer-sky').click(function () {
        if (activeLayer === 'sky') {
            return;
        }

        skyLayerBackgroundImage.addTo(map);
        map.removeLayer(surfaceLayerBackgroundImage);
        map.removeLayer(caveLayerBackgroundImage);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('sky');
    });

    jQuery.getJSON('data/locations.json', function (data) {
        jQuery(data.surface).each(function (idx, location) {
            if (location.name.length < 1 || location.locations.length < 1) {
                return;
            }

            jQuery(location.locations).each(function (idx, pos) {
                var tempToolTip = L.tooltip([pos.x, pos.y], {
                    className: 'locationArea',
                    content: location.name,
                    direction: 'center',
                    permanent: true,
                    sticky: true
                })
                    .openTooltip(map);

                if (location.raw.includes('MapRegion') === true) {
                    zoomLayer1.addLayer(tempToolTip);
                } else if (location.raw.includes('MapArea') === true) {
                    zoomLayer2.addLayer(tempToolTip);
                }
            });
        });

        zoomLayer1.addTo(map);
    });

    jQuery('#show-layer-surface').click(function () {
        if (activeLayer === 'surface') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        surfaceLayerBackgroundImage.addTo(map);
        map.removeLayer(caveLayerBackgroundImage);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('surface');
    }).trigger('click');

    jQuery('#show-layer-cave').click(function () {
        if (activeLayer === 'cave') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        map.removeLayer(surfaceLayerBackgroundImage);
        caveLayerBackgroundImage.addTo(map);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('cave');
    });

    jQuery('#show-layer-depths').click(function () {
        if (activeLayer === 'depths') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        map.removeLayer(surfaceLayerBackgroundImage);
        map.removeLayer(caveLayerBackgroundImage);
        depthsLayerBackgroundImage.addTo(map);

        activateLayer('depths');
    });


    jQuery('#showNone').click(function () {
        if (activeRoute !== '') {
            disableRoute(activeRoute)
        }
        activeRoute = ''
    });

    jQuery('#show-all-dungeons').click(function () {
        if (activeRoute === 'allDungeons') {
            return;
        }

        activateRoute('allDungeons');
    });

    jQuery('#show-hundo').click(function () {
        if (activeRoute === 'hundo') {
            return;
        }

        activateRoute('hundo');
    });

    jQuery('#show-all-quests').click(function () {
        if (activeRoute === 'allQuests') {
            return;
        }

        activateRoute('allQuests');
    });


    jQuery('#show-side-adventures').click(function () {
        if (activeRoute === 'sideAdventures') {
            return;
        }

        activateRoute('sideAdventures');
    });

    jQuery('#btn-add-segment').click(function () {
        segmentName = prompt("New Segment Name")
        routes[activeRoute].segments.push({"name": segmentName, "points": []})
        jQuery('#segment-filters .' + activeRoute).append('<label><input type="checkbox" checked value="' + routes[activeRoute].segments.length - 1 + '">' + segmentName + '</label>');
        redrawRouteMarkers(activeRoute);
    });

    jQuery('#btn-reset').click(function () {
        if (confirm("Sure you want to reset your route?")) {
            localStorage.removeItem(activeRoute);
            parseRouteFile(activeRoute);
        }
    });
    
    jQuery('#btn-import').click(function () {
        routes[activeRoute].segments = JSON.parse(prompt("Paste route here"));
        redrawRouteMarkers(activeRoute);
    });
    
    jQuery('#btn-export').click(function () {
        prompt("Copy to clipboard: Ctrl+C, Enter", localStorage.getItem(activeRoute));
    });

    function activateRoute(route) {
        if (activeRoute === route) {
            return;
        }
        if (routes[activeRoute]) {
            disableRoute(activeRoute)
        }

        activeRoute = route;

        if (!routes[route]) {
            parseRouteFile(route)
        } else {
            enableRoute(route)
        }
    }
    
    function enableRoute(routeName) {
        jQuery('#segment-filters div.' + routeName).show();
        routes[routeName].segments.forEach(function (segment, segmentIdx) {
            if (segment.visible) {
                segment.pointsLayerGroup.addTo(map);
                segment.lineLayerGroup.addTo(map);
                segment.markerLayerGroup.addTo(map);
                segment.previousConnector.addTo(map);
            }
        });

        routes[routeName].markers[activeLayer].layerGroup.addTo(map);
    }
    
    function disableRoute(routeName) {
        jQuery('#segment-filters div.' + routeName).hide();
        routes[routeName].segments.forEach(function (segment) {
            map.removeLayer(segment.pointsLayerGroup);
            map.removeLayer(segment.lineLayerGroup);
            map.removeLayer(segment.markerLayerGroup);
            map.removeLayer(segment.previousConnector);
        });

        map.removeLayer(routes[routeName].markers[activeLayer].layerGroup);
    }

    function createPolylineBetweenPoints(point1, point2, pointIdx, segmentIdx) {
        return L.polyline([[point1.pos.x, point1.pos.y], [point2.pos.x, point2.pos.y]], {color: "white", weight: 6})
            .on('mousedown', (ed) => { 
                map.dragging.disable();
                draggedPointIdx = pointIdx;
                draggedSegmentIdx = segmentIdx;
                map.on('mouseup', (eu) => {
                    map.dragging.enable();
                    draggedPointIdx = -1;
                    draggedSegmentIdx = -1;
                    map.off('mouseup')
                })
             })
    }

    function createPolylineDecoratorBetweenPoints(point1, point2) {
        patterns = {}
        if (point2.teleport === true) {
            patterns = [
                {offset: 0, repeat: 5, symbol: L.Symbol.dash({pixelSize: 0, pathOptions: {fillOpacity: 1, weight: 2}})},
                {offset: 25, repeat: 150, symbol: L.Symbol.arrowHead({pixelSize: 20, pathOptions: {fillOpacity: 1, weight: 0}})}
            ]
        } else {
            patterns = [
                {offset: 25, repeat: 150, symbol: L.Symbol.arrowHead({pixelSize: 20, pathOptions: {fillOpacity: 1, weight: 0}})}
            ]
        }

        return L.polylineDecorator([[point1.pos.x, point1.pos.y], [point2.pos.x, point2.pos.y]], {
            patterns: patterns
        })
    }
    
    function appendToRoute(routeName, layer, objName, posIdx, pointIdx, segmentIdx = -1) {
        lastActiveSegment = null
        if (segmentIdx != -1) {
            lastActiveSegment = routes[routeName].segments[segmentIdx]
        } else {
            lastActiveSegment = routes[routeName].segments.findLast((e) => e.visible);
            if (lastActiveSegment.points.length > 0 && (pointIdx == -1 || pointIdx == lastActiveSegment.points.length - 1)) {
                lastPoint = lastActiveSegment.points.slice(-1)[0];
                if (lastPoint.objName == objName && lastPoint.locationIdx == posIdx) {
                    return;
                }
            }
        }

        point = {};
        point.layer = layer;
        point.objName = objName;
        point.locationIdx = posIdx;
        if (pointIdx == -1) {
            lastActiveSegment.points.push(point);
        } else {
            lastActiveSegment.points.splice(pointIdx, 0, point);
        }
        redrawRouteMarkers(routeName);
    }

    function redrawRouteMarkers(routeName) {
        localStorage.setItem(routeName, JSON.stringify(routes[routeName].segments, ["name", "points", "layer", "objName", "locationIdx", "note", "visible"]));

        routes[routeName].segments.forEach(function (segment, segmentIdx) {
            if (typeof segment.pointsLayerGroup !== 'undefined') {
                map.removeLayer(segment.pointsLayerGroup);
                map.removeLayer(segment.lineLayerGroup);
                map.removeLayer(segment.markerLayerGroup);
                map.removeLayer(segment.previousConnector);
            }

            segment.pointsLayerGroup = L.layerGroup();
            segment.lineLayerGroup = L.layerGroup();
            segment.markerLayerGroup = L.layerGroup();
            segment.previousConnector = L.layerGroup();
            segment.points.forEach(function (point, pointIdx) {
                if (point.objName in routes[routeName].markers[point.layer].objs) {
                    routeMarkers = routes[routeName].markers[point.layer].objs[point.objName]
                    let stolenMarker = routeMarkers.markers[point.locationIdx]
                    segment.markerLayerGroup.addLayer(stolenMarker)
                    routes[routeName].markers[point.layer].layerGroup.removeLayer(stolenMarker)
                }
                point.obj = layers[point.layer][point.objName];
                point.pos = point.obj.locations[point.locationIdx];
                point.marker = new L.Marker([point.pos.x, point.pos.y], {icon: L.ExtraMarkers.icon({icon: 'fa-number', markerColor: colors[point.layer], number: pointIdx + 1})})
                    .on('click', (e) => { 
                        if (e.originalEvent.ctrlKey) {
                            segment.points.splice(pointIdx, 1);
                            redrawRouteMarkers(routeName);
                        } else if (e.originalEvent.altKey) {
                            appendToRoute(routeName, point.layer, point.objName, point.locationIdx, -1);
                        } else if (e.originalEvent.shiftKey) {
                            newNote = prompt("Edit note", point.note);
                            if (newNote)
                                point.note = newNote;
                                redrawRouteMarkers(routeName);
                        }
                    });
                    
                point.marker.bindPopup(
                    createMarkerPopup(point.pos, point.layer, point.objName, point.locationIdx) +
                    `<div><b>Segment:</b> ${segment.name}</div>` +
                    `<span><b>Note:</b>${point.note ? point.note : ''}</span>`
                );
                segment.pointsLayerGroup.addLayer(point.marker);

                if (pointIdx > 0) {
                    if (point.teleport !== true) {
                        segment.lineLayerGroup.addLayer(createPolylineBetweenPoints(segment.points[pointIdx - 1], point, pointIdx, segmentIdx))
                    }
                    segment.lineLayerGroup.addLayer(createPolylineDecoratorBetweenPoints(segment.points[pointIdx - 1], point))
                }
            });
            // TODO: Make this toggleable
            // if (segmentIdx > 0) {
            //     if (segment.points[0].teleport !== true) {
            //         segment.previousConnector.addLayer(createPolylineBetweenPoints(routes[routeName].segments[segmentIdx - 1].points.at(-1), segment.points[0], 0));
            //     }
            //     segment.previousConnector.addLayer(createPolylineDecoratorBetweenPoints(routes[routeName].segments[segmentIdx - 1].points.at(-1), segment.points[0]));
            // }
        });

        routes[routeName].segments.forEach(function (segment, segmentIdx) {
            if (segment.visible) {
                segment.pointsLayerGroup.addTo(map);
                segment.lineLayerGroup.addTo(map);
                segment.markerLayerGroup.addTo(map);
                segment.previousConnector.addTo(map);
            }
        });
    }

    function parseRouteFile(routeName) {
        storedSegments = JSON.parse(localStorage.getItem(routeName))
        jQuery.getJSON("data/route/" + routeName + ".json", function (data) {
            routes[routeName] = data
            if (storedSegments) {
                routes[routeName].segments = storedSegments
            }

            data.markers = {
                'sky': {},
                'surface': {},
                'depths': {},
                'cave': {}
            }
            
            for (const [layer, layerData] of Object.entries(data.markers)) {
                layerData.objs = {}
                layerData.layerGroup = L.layerGroup();
                for (const [markerName, markerData] of Object.entries(routes[routeName].enabledMarkers)) {
                    let icon = L.icon({
                        iconUrl: "assets/images/route_icons/" + markerName + '.png',
                        iconSize:     [40, 40],
                        iconAnchor:   [20, 20]
                    });
                    markerData.objNames.forEach((objName) => {
                        if (objName in layers[layer]) {
                            layerData.objs[objName] = {}
                            layerData.objs[objName].base = layers[layer][objName]
                            layerData.objs[objName].markers = new Array();
                            layerData.objs[objName].base.locations.forEach((pos, posIdx) => {
                                marker = L.marker([pos.x, pos.y], {icon: icon})
                                    .on('click', (ed) => {  
                                        if (ed.originalEvent.altKey) {
                                            appendToRoute(routeName, layer, objName, posIdx, -1);
                                        }
                                    })
                                    .on('mouseup', (e) => {
                                        if (draggedPointIdx != -1) {
                                            appendToRoute(routeName, layer, objName, posIdx, draggedPointIdx, draggedSegmentIdx);
                                            redrawRouteMarkers(routeName);
                                        }
                                        draggedPointIdx = -1;
                                        draggedSegmentIdx = -1;
                                    });
    
                                marker.bindPopup(
                                    createMarkerPopup(pos, layer, objName, posIdx)
                                );

                                layerData.objs[objName].markers.push(marker);
                                layerData.layerGroup.addLayer(marker);
                            });
                        }
                    });
                }
            }
    
            redrawRouteMarkers(routeName);
            routes[routeName].segments.forEach(function (segment, segmentIdx) {
                jQuery('#segment-filters .' + routeName).append('<label><input type="checkbox" ' + (segment.visible ? "checked" : "") + ' " value="' + segmentIdx + '">' + segment.name + '</label>');
            });
            
            jQuery(document).on('change', '#segment-filters .' + routeName + ' input', function (e) {
                let segmentIdx = jQuery(this).val();
                segment = routes[routeName].segments[segmentIdx]
                if (this.checked === false) {
                    segment.visible = false;
                    map.removeLayer(segment.pointsLayerGroup);
                    map.removeLayer(segment.lineLayerGroup);
                    map.removeLayer(segment.markerLayerGroup);
                    map.removeLayer(segment.previousConnector);
                } else {
                    routes[routeName].segments[segmentIdx].visible = true;
                    segment.pointsLayerGroup.addTo(map);
                    segment.lineLayerGroup.addTo(map);
                    segment.markerLayerGroup.addTo(map);
                    segment.previousConnector.addTo(map);
                }
            });
            enableRoute(routeName);
        });
    }

    function createMarkerPopup(point, layer, objName, pointIdx) {
        let displayName = layers[layer][objName].name;

        if (displayName && displayName.length > 0) {
            displayName += '<span class="smaller-name">';
        }

        displayName += objName;
        displayName += ` (${pointIdx})`;
        displayName += '</span>';

        let iconsHtml = '';
        if (typeof layers[layer][objName].icons !== 'undefined' && layers[layer][objName].icons.length > 0) {
            iconsHtml += "<div class='totk-marker-icons'>";

            layers[layer][objName].icons.forEach(function (icon, index) {
                let fileEnd = 'png';
                if (icon.includes('_Icon')) {
                    fileEnd = 'jpg';
                }

                iconsHtml += "<img src='assets/images/icons/" + icon + "." + fileEnd + "' alt='" + icon + "'>"
            });

            iconsHtml += "</div>";
        }
        
        return "<div class='totk-marker'>" +
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
    }

    function activateLayer(layer) {
        if (activeLayer.length > 0 && allMarkerLayers[activeLayer]) {
            map.removeLayer(allMarkerLayers[activeLayer]);
        }

        activeLayer = layer;

        if (allMarkerLayers[activeLayer] === undefined) {
            allMarkerLayers[activeLayer] = L.layerGroup();
        }

        resetFilters();

        allMarkerLayers[activeLayer].addTo(map);

        jQuery('#item-filters div:not(.' + activeLayer + ')').hide();
        jQuery('#item-filters div.' + activeLayer).show();

        updateLocations();
        
        if (activeRoute !== '')
        {
            for (const [layer, layerData] of Object.entries(routes[activeRoute].markers)) {
                map.removeLayer(layerData.layerGroup);
            }

            routes[activeRoute].markers[activeLayer].layerGroup.addTo(map);
        }
        doSearch();
    }

    function parseLayers(layer, data) {
        layers[layer] = data;

        let markerHtml = '';
        Object.entries(data).forEach(function (markerGroup, index) {
            let displayName = markerGroup[1].name;

            if (displayName && displayName.length > 0) {
                displayName += '<span class="smaller-name">';
                displayName += ' - ';
            }

            let searchName = (markerGroup[1].name + " " + markerGroup[0]).toLocaleLowerCase();

            displayName += markerGroup[0];
            displayName += '</span>';

            markerHtml += '<label data-search-value="' + searchName + '">' +
                '<input type="checkbox" value="' + markerGroup[0] + '">' +
                displayName +
                ' <span class="locations-count">(' +
                markerGroup[1].locations.length +
                ')</span>' +
                '</label>';
        });

        jQuery('#item-filters .' + layer).append(markerHtml);

        jQuery(document).on('change', '#item-filters .' + layer + ' input', function (e) {
            let val = jQuery(this).val();

            if (layers[layer][val].markers) {
                if (this.checked === false) {
                    map.removeLayer(layers[layer][val].markers);
                } else {
                    map.addLayer(layers[layer][val].markers);
                }
            } else {
                loadLayer(layer, val)
            }
        });
    }

    function loadLayer(layer, val) {
        let iconClass = getIconClass();

        layers[layer][val].markers = L.markerClusterGroup({
            removeOutsideVisibleBounds: true,
            spiderfyOnMaxZoom: false,
            disableClusteringAtZoom: 0,
            animate: false,
            maxClusterRadius: 20,
            iconCreateFunction: function (cluster) {
                return L.divIcon({
                    html: cluster.getChildCount(),
                    className: iconClass,
                    iconSize: [18, 18],
                });
            }
        });

        layers[layer][val].locations.forEach(function (point, index) {
            let marker = L.marker([point.x, point.y], {
                icon: L.divIcon({className: iconClass}),
                keyboard: false,
                iconSize: [3, 3],
                radius: 3,
                title: point.z + ' - ' + val,
            })
            .on('click', (ed) => {
                if (ed.originalEvent.altKey) {
                    appendToRoute(activeRoute, layer, val, index, -1);
                }
            })
            .on('mouseup', (e) => {
                if (draggedPointIdx != -1) {
                    appendToRoute(activeRoute, layer, val, index, draggedPointIdx, draggedSegmentIdx);
                    redrawRouteMarkers(activeRoute);
                }
                draggedPointIdx = -1;
                draggedSegmentIdx = -1;
            });

            marker.bindPopup(
                createMarkerPopup(point, layer, val, index)
            );

            layers[layer][val].markers.addLayer(marker);
        });

        allMarkerLayers[activeLayer].addLayer(layers[layer][val].markers);
    }

    jQuery('#filter-search input[type=search]').on('input', doSearch);

    function doSearch() {
        let searchVal = jQuery('#filter-search input[type=search]').val();
        if (searchVal.length === 0) {
            jQuery('#item-filters .' + activeLayer + ' label').show();
            return;
        }

        searchVal = searchVal.toLocaleLowerCase();

        jQuery('#item-filters .' + activeLayer + ' label[data-search-value*="' + searchVal + '"]').show();
        jQuery('#item-filters .' + activeLayer + ' label:not([data-search-value*="' + searchVal + '"])').hide();
    }

    function getIconClass() {
        window.lastIconClass++;
        if (window.lastIconClass > 12) {
            window.lastIconClass = 0;
        }

        return 'big-marker' + window.lastIconClass;
    }

    function resetFilters() {
        jQuery('#item-filters input:checked').trigger('click');
        // jQuery('#item-filters .' + activeLayer + ' input:checked').trigger('click');
    }

    jQuery('#reset-filters').click(resetFilters);

    jQuery('#show-filtered-filters').click(function () {
        let visibleInputs = jQuery('#item-filters input:not(:checked):visible');

        if (visibleInputs.length > 100 &&
            confirm("You're activating " + visibleInputs.length + " different markers at the same time, which might possibly crash your browser. Do you wish to continue?") === false) {
            return;
        }

        visibleInputs.trigger('click');
    });

    jQuery('#hide-filtered-filters').click(function () {
        jQuery('#item-filters input:checked:visible').trigger('click');
    });
    
    ["cave", "depths", "sky", "surface"].forEach((type) => {
        jQuery.getJSON("data/layers/" + type + ".json", function (data) {
            parseLayers(type, data);
        });
    });
});
