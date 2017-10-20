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
    var autocomplete = new google.maps.places.Autocomplete(input, { placeIdOnly: true });
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
            map.setZoom(11);
            map.setCenter(results[0].geometry.location);
            // Set the position of the marker using the place ID and location.
            marker.setPlace({
                placeId: place.place_id,
                location: results[0].geometry.location
            });
            marker.setVisible(true);
            infowindowContent.children['place-name'].textContent = place.name;
            infowindowContent.children['place-id'].textContent = '';
            infowindowContent.children['place-address'].textContent =
                results[0].formatted_address;
            //infowindow.open(map, marker);
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
