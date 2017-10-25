// Global variables
var placeobj = {};
var map;
var noise_data = [];
var markers = [];
var marker;
var markerpin = false;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
        mapTypeControl: false
    });
    fnHideBusinessFeatures(map);
    //fnGetUserGeolocation(map);

    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchbar');
    var autocomplete = new google.maps.places.Autocomplete(input,
        {
            componentRestrictions: { country: "US" }
        }
        );
    autocomplete.bindTo('bounds', map);
    //DOM Listeners
    google.maps.event.addDomListener(input, 'keydown', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    });

    //declare infowindow
    var infowindow = new google.maps.InfoWindow();

    //declare an empty marker object
    marker = new google.maps.Marker({
        map: map,
        draggable: true,
        anchorPoint: new google.maps.Point(0, -29)
    });

    //marker listener: click
    marker.addListener('click', function () {
        console.log("marker clicked");
        markerpin = true;
        //infowindow.open(map, marker);
    });
    //marker listener: dragging
    marker.addListener('drag', function () {
        console.log("marker dragged");
        infowindow.close();
        fnDeleteMarkers();
        fnDisplayResultView(false);
        fnToggleSectionVisibility(false);
        fnUpdatePlaceObjWithMarker();
        fnDisplayInputAddress();
    });
    //marker listener: dragend
    marker.addListener('dragend', function () {
        console.log("marker drag ended");
        infowindow.close();
        fnDeleteMarkers();
        fnDisplayResultView(false);
        fnToggleSectionVisibility(false);
        map.setCenter(marker.position);
        fnUpdatePlaceObjWithMarker();
        fnDisplayInputAddress();
        fnSetInfoWindowContent(infowindow);
        fnMapZoomIn();
        fnGet311NoiseData(undefined);
    });
    //marker listener: mouseover/hover
    marker.addListener('mouseover', function () {
        console.log("marker hovered");
        infowindow.open(map, marker);
    });
    //marker listener: mouseout
    marker.addListener('mouseout', function () {
        console.log("marker mouseout");
        if (markerpin == false)
            infowindow.close();
    });
    //autocomplete listeners
    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        marker.setVisible(false);
        fnDeleteMarkers();
        fnToggleSectionVisibility(false);
        var place = autocomplete.getPlace();
        console.log("place: ", place);
        if (!place.geometry) {
            fnSearchError(true, "Please make sure to input an actual address. ");
            return;
        }
        fnSearchError(false, '');
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
            map.setCenter(place.geometry.location);
            fnMapZoomIn();
        } else {
            map.setCenter(place.geometry.location);
            fnMapZoomIn();
        }
        // Set the position of the marker.
        console.log("place.geometry.location: ", place.geometry.location);
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
        fnUpdatePlaceObjWithPlace(place);
        fnSetInfoWindowContent(infowindow);
        fnDisplayInputAddress();
        fnGet311NoiseData(undefined);
    });
}

function fnMapZoomIn() {
    map.setZoom(18);
}

function fnMapZoomOut() {
    map.setZoom(13);
}

function fnHideBusinessFeatures() {
    var styles = {
        default: null,
        hide: [
          {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }]
          },
          {
              featureType: 'transit',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'off' }]
          }
        ]
    };
    map.setOptions({ styles: styles['hide'] });
}

// Sets the map on all markers in the array.
function fnSetMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function fnClearMarkers() {
    fnSetMapOnAll(null);
}

// Shows any markers currently in the array.
function fnShowMarkers() {
    fnSetMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function fnDeleteMarkers() {
    fnClearMarkers();
    markers = [];
}

function fnGetUserGeolocation() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            //infoWindow.setPosition(pos);
            //infoWindow.setContent('Location found.');
            //infoWindow.open(map);
            map.setCenter(pos);
            var curMarker = new google.maps.Marker({
                position: pos,
                icon: {
                    url: "images/currentlocation.png",
                    scaledSize: new google.maps.Size(64, 64)
                },
                map: map,
                title: "You're here",
                animation: google.maps.Animation.DROP,
            });
            markers.push(marker);
        }, function () {
            console.log("The Geolocation service failed.");
        });
    } else {
        console.log("Browser doesn't support Geolocation");
    }
}

function fnIsDefined(object) {
    return ((object !== undefined) && (object !== null));
}

function fnIsNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function fnSearchError(bool, message) {
    var div = document.getElementById('searcherror_div');
    if (bool == true) {
        div.style.display = "block";
        document.getElementById("searcherror").innerHTML = message;
    }
    else {
        div.style.display = "none";
        document.getElementById("searcherror").innerHTML = message;
    }

}

function fnUpdatePlaceObjWithPlace(place) {
    placeobj.name = place.name;
    placeobj.lat = place.geometry.location.lat();
    placeobj.lng = place.geometry.location.lng();
    placeobj.formatted_address = place.formatted_address;
}

function fnUpdatePlaceObjWithMarker() {
    placeobj.name = "Dropped Pin";
    placeobj.lat = marker.position.lat();
    placeobj.lng = marker.position.lng();
    placeobj.formatted_address = placeobj.lat + ", " + placeobj.lng;
}

function fnDisplayInputAddress() {
    var infowindowContent = document.getElementById('infowindow-content');
    if (placeobj.name !== '')
        infowindowContent.children['place-name'].textContent = placeobj.name;
    if (placeobj.formatted_address !== '')
        infowindowContent.children['place-address'].textContent = placeobj.formatted_address;
}

function fnSetInfoWindowContent(infowindow) {
    var htmlstr = '<div class="padding-5">'
                    + '<span><b>' + placeobj.name + '</b></span><br>'
                    + '<span>' + placeobj.formatted_address + '</span>'
                + '</div>';
    infowindow.setContent(htmlstr);
}

function fnGet311NoiseData(diameter) {
    console.log("fnGet311NoiseData called with placeobj: ", placeobj);
    console.log("diameter: ", diameter);
    if (diameter == undefined)
        diameter = 100;
    console.log("diameter: ", diameter);
    var requestUrl = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json"
                   + "?$select=" + "created_date,complaint_type,descriptor,incident_address,incident_zip,location_type,latitude,longitude"
                   + "&$where="  + "within_circle(location, " + placeobj.lat + ", " + placeobj.lng + ", " + diameter + ")AND "
                                 + "complaint_type like '%25Noise%25'";
    console.log("requestUrl:, ", requestUrl);
    $.ajax({
        url: requestUrl,
        type: "GET",
        data: {
            "$limit": 10000,
            "$$app_token": "GLPXsrxLKiRZJ6nUO5kwCdw3p"
        }
    }).done(function (data, diameter) {
        console.log("fnGet311NoiseData returned data: ", data);
        fnSuccessCallBack("noise-text", data, diameter);
        noise_data = data;
    });
}

function fnSuccessCallBack(textid, data, diameter) {
    console.log("fnSuccessCallBack called");
    console.log("diameter: ", diameter);
    fnToggleSectionVisibility(true);
    if (fnIsNumber(diameter))
        document.getElementById(textid).innerHTML = "We found " + data.length + " noise complaints within " + diameter + " meters nearby.";
    else
        document.getElementById(textid).innerHTML = "We found " + data.length + " noise complaints nearby.";
}

function fnDisplayResultButton(resulttype) {
    console.log("fnDisplayResultButton called with parameter resulttype:", resulttype);
    fnDeleteMarkers();
    var latvalue,
        lngvalue;
    for (i = 0; i < noise_data.length; i++) {
        latvalue = Number.parseFloat(noise_data[i].latitude);
        lngvalue = Number.parseFloat(noise_data[i].longitude);
        fnDisplayResultMarker(latvalue, lngvalue);
    }
    fnDisplayResultView(true, resulttype);
}

function fnGetResultKey(resulttype) {
    console.log("fnGetResultKey called with parameter resulttype:", resulttype);
    switch (resulttype) {
        case 'noise_data':
            return noise_data[0];
    }
}

function fnDisplayResultView(bool, resulttype) {
    console.log("fnDisplayResultView called with parameter resulttype:", resulttype);
    if (bool == false) {
        document.getElementById("result-view").innerHTML = '';
        return;
    }
    var dataSource = fnGetResultKey(resulttype);
    console.log(dataSource);
    var columnArr = Object.keys(fnGetResultKey(resulttype));
    console.log("keys: ", columnArr);
    var itemArr = ["10/12/2017", "00:12AM", "Noise: Construction Before/After Hours (NM1)"]
    var columnHTML = "",
        itemHTML   = "";
    for (i = 0; i < columnArr.length; i++) {
        columnHTML += "<th>" + columnArr[i] + "</th>";
        itemHTML += "<td>" + itemArr[i] + "</td>";
    }
    console.log(columnHTML);
    var html_headfoot =
               "<thead>"
                    + "<tr>"
                        + columnHTML
                    + "</tr>"
             + "</thead>"
             + "<tfoot>"
                     + "<tr>"
                         + columnHTML
                     + "</tr>"
              + "</tfoot>";
    var html_body =
               "<tbody>"
                    + "<tr>"
                        + itemHTML
                    + "</tr>"
             + "</tbody>";
    document.getElementById("result-view").innerHTML = html_headfoot + html_body;
}

function fnDisplayResultMarker(latvalue, lngvalue) {
    pos = { lat: latvalue, lng: lngvalue };
    var resMarker = new google.maps.Marker({
        position: pos,
        icon: {
            url: "images/pin.png",
            scaledSize: new google.maps.Size(32, 32)
        },
        map: map,
        //title: "ResultMarkerTitle",
        animation: google.maps.Animation.DROP
    });
    markers.push(resMarker);
}

function fnToggleSectionVisibility(bool) {
    console.log("fnToggleSectionVisibility called");
    var sections = [
        "noise-div",
        "crime-div",
        "mouse-div",
        "price-div",
        "commute-div",
        "parking-div",
        "show-all-div"
    ];
    var div;
    for (i = 0; i < sections.length; i++) {
        div = document.getElementById(sections[i]);
        if (bool == true) {
            div.style.display = "block";
        }
        else {
            div.style.display = "none";
        }
    }
}

function fnToggleResultViewVisibility(bool) {
    var div = document.getElementById("result-view-container");
    if (bool == true) {
        div.style.display = "block !important";
    }
    else {
        div.style.display = "none !important";
    }
}
