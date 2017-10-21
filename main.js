var placeobj = {};

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
        gestureHandling: 'cooperative', //ctrl+scroll to zoom
        mapTypeControl: false //no satellite map
        //gestureHandling: 'greedy' //mouse scroll to zoom
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchbar');
    var autocomplete = new google.maps.places.Autocomplete(input,
        {
            placeIdOnly: true,
            componentRestrictions: { country: "US" }
        }
        );
    autocomplete.bindTo('bounds', map);
    google.maps.event.addDomListener(input, 'keydown', function(event) { 
        if (event.keyCode === 13) { 
            event.preventDefault(); 
        }
    });
    var infowindow = new google.maps.InfoWindow();
    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);
    var geocoder = new google.maps.Geocoder;
    var marker = new google.maps.Marker({
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });
    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });

    autocomplete.addListener('place_changed', function () {
        infowindow.close();
        var place = autocomplete.getPlace();
        if (!place.place_id) {
            fnSearchError(true, "Please make sure to input an actual address. ");
            return;
        }
        fnSearchError(false, '');
        geocoder.geocode({ 'placeId': place.place_id }, function (results, status) {

            if (status !== 'OK') {
                fnSearchError(true,'Geocoder failed due to: ' + status);
                return;
            }
            fnSearchError(false, '');
            console.log(results)
            map.setZoom(16);
            map.setCenter(results[0].geometry.location);
            // Set the position of the marker using the place ID and location.
            marker.setPlace({
                placeId: place.place_id,
                location: results[0].geometry.location
            });
            marker.setVisible(true);
            //set placeobj value
            placeobj.formatted_address = results[0].formatted_address;
            placeobj.place_id = place.place_id;
            placeobj.name = place.name;
            placeobj.lat = results[0].geometry.location.lat();
            placeobj.lng = results[0].geometry.location.lng();
            console.log(placeobj);
            //display results
            fnDisplayResults(placeobj);
            
            //infowindow.open(map, marker); //comment this to stop auto-displaying result tag
        });
    });
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

function fnDisplayResults(placeobj) {
    var infowindowContent = document.getElementById('infowindow-content');
    infowindowContent.children['place-name'].textContent = placeobj.name;
    infowindowContent.children['place-id'].textContent = ''; //place.place_id;
    infowindowContent.children['place-address'].textContent = placeobj.formatted_address;
}
