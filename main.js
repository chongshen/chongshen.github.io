var placeobj = {};

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchbar');
    var autocomplete = new google.maps.places.Autocomplete(input,
        {
            componentRestrictions: { country: "US" }
        }
        );
    autocomplete.bindTo('bounds', map);
    //DOM Listeners
    google.maps.event.addDomListener(input, 'keydown', function(event) { 
        if (event.keyCode === 13) { 
            event.preventDefault(); 
        }
    });

    //declare infowindow
    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);

    //declare an empty marker object
    var marker = new google.maps.Marker({
        map: map,
        draggable: true,
        anchorPoint: new google.maps.Point(0, -29)
    });

    //marker listeners
    marker.addListener('click', function () {
        console.log("marker clicked");
        infowindow.open(map, marker);
    });
    marker.addListener('drag', function () {
        console.log("marker dragging");
    });
    marker.addListener('dragend', function () {
        console.log("marker drag ended");
    });


    //autocomplete listeners
    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        marker.setVisible(false);
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
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
        }
        // Set the position of the marker.
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
        // display results text on webpage
        fnUpdatePlaceObj(place);
        console.log(placeobj);
        fnDisplayResults(placeobj);
        // ajax to 311Noise
        fnGet311NoiseData(placeobj);
    });
}

function fnIsDefined(object) {
    return ((object !== undefined) && (object !== null));
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

function fnUpdatePlaceObj(place) {
    placeobj.name = place.name;
    placeobj.lat = place.geometry.location.lat();
    placeobj.lng = place.geometry.location.lng();
    placeobj.formatted_address = place.formatted_address;
}

function fnDisplayResults(placeobj) {
    var infowindowContent = document.getElementById('infowindow-content');
    if (fnIsDefined(placeobj.name))
        infowindowContent.children['place-name'].textContent = placeobj.name;
    infowindowContent.children['place-address'].textContent = placeobj.formatted_address;
}

function fnGet311NoiseData(placeobj, diameter) {
    console.log("fnGet311NoiseData called with placeobj: ", placeobj);
    if (!fnIsDefined(diameter))
        diameter = 100;
    var requestUrl = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json"
                   + "?$where=within_circle(location, " + placeobj.lat + ", " + placeobj.lng + ", " + diameter + ")"
                   + "AND complaint_type like '%25Noise%25'";
    console.log("requestUrl:, ", requestUrl);
    $.ajax({
        //url: "https://data.cityofnewyork.us/resource/fhrw-4uyv.json?$where=within_circle(location, 40.7401991, -73.9855632, 100) AND complaint_type like '%25Noise%25'",
        url: requestUrl,
        type: "GET",
        data: {
            "$limit": 10000,
            "$$app_token": "GLPXsrxLKiRZJ6nUO5kwCdw3p"
        }
    }).done(function (data) {
        alert("Retrieved " + data.length + " records from the dataset!");
        console.log(data);
    });
}
