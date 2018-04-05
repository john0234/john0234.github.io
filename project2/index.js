// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map;

function initMap() {

    var center = {lat: 44.954445, lng: -93.091301};
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 13
    });
    var geocoder = new google.maps.Geocoder;
    var infowindow = new google.maps.InfoWindow();

    //TODO this might not be necessary?
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(44.9537, -93.0900),
        map:map,
        draggable: true,
        visible: false
    });


    var card = document.getElementById('pac-card');
    var input = document.getElementById('pac-input');
    var types = document.getElementById('type-selector');
    var strictBounds = document.getElementById('strict-bounds-selector');

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

    var autocomplete = new google.maps.places.Autocomplete(input);

    //TODO: autocomplete is the variable that we need to track. AKA it is where the map is going to search.

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.

    autocomplete.bindTo('bounds', map);

    var infowindowContent = document.getElementById('infowindow-content');
    infowindow.setContent(infowindowContent);

    autocomplete.addListener('place_changed', function() {
        infowindow.close();
        marker.setVisible(false);
        var place = autocomplete.getPlace();


        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
        }

        marker.setPosition(place.geometry.location);
        marker.setVisible(false);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        infowindowContent.children['place-icon'].src = place.icon;
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = address;
        infowindow.open(map, marker);
    });

    // Sets a listener on a radio button to change the filter type on Places
    // Autocomplete.
    /*
        //TODO: also, do we need this?
        function setupClickListener(id, types) {
            var radioButton = document.getElementById(id);
            radioButton.addEventListener('click', function() {
                autocomplete.setTypes(types);
            });
        }

        //TODO: why is this here?
        setupClickListener('changetype-all', []);
        setupClickListener('changetype-address', ['address']);
        setupClickListener('changetype-establishment', ['establishment']);
        setupClickListener('changetype-geocode', ['geocode']);
    */

    document.getElementById('use-strict-bounds')
        .addEventListener('click', function() {
            console.log('Checkbox clicked! New state=' + this.checked);
            autocomplete.setOptions({strictBounds: this.checked});
        });

    map.addListener('dragend', function(){
        geocodeLatLong(map,geocoder,infowindow,input);
    });

}//end of init map

function geocodeLatLong(map,geocoder,infowindow,input){

    var latlng = {lat: map.getCenter().lat(), lng: map.getCenter().lng()};
    geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {

                input.value = results[0].formatted_address;

            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}

var app = angular.module('ngMapComponentsApp', []);

var markers = [];

function removeMarkers(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

app.controller('ctr1', function ($scope) {

    var google_interval = setInterval(function() {

        if(map !== undefined)
        {
            clearInterval(google_interval);
            $scope.map = map;

            //this essentially sets up the map window with the API call.
            panReset();

            $scope.map.addListener('dragend', function(){
                //this keeps same radius
                dragReset();
            });

            $scope.map.addListener('zoom_changed',function () {
                //this completely resets the map window with the information from the api... again
                panReset();
            });
        }
    }, 500);

    function addMarker(location) {
        marker = new google.maps.Marker({
            position: location,
            map:$scope.map
        });
        markers.push(marker);
    }

    function panReset(){

        $scope.bounds = $scope.map.getBounds();
        $scope.center = $scope.map.getCenter();
        if ($scope.bounds && $scope.center) {
            $scope.ne = $scope.bounds.getNorthEast();
            // Calculate radius (in meters).
            $scope.radius = google.maps.geometry.spherical.computeDistanceBetween($scope.center, $scope.ne);
        }

        var interval = setInterval(function () {

            if($scope.radius !== undefined){

                clearInterval(interval);
                buildURL();

                //TODO: create the array to display in the table

                $.getJSON($scope.url, function(data) {

                    //console.log(data);
                    $scope.measurements = [];

                    for(i = 0; i < data.results.length; i++){
                        $scope.formatted_JSON = {particle:'',measurement:'',date:'',coords:''};
                        $scope.data=data.results[i];
                        $scope.latlng = {lat: $scope.data.coordinates.latitude, lng:$scope.data.coordinates.longitude};
                        $scope.formatted_JSON.particle = $scope.data.parameter;
                        $scope.formatted_JSON.measurement = $scope.data.value;
                        $scope.formatted_JSON.date = "04/4/2018";
                        $scope.formatted_JSON.coords = "" + $scope.data.coordinates.latitude + "," + $scope.data.coordinates.longitude;

                        addMarker($scope.latlng);

                        $scope.measurements.push($scope.formatted_JSON);

                    }

                });

            }

        },500);

    }

    function dragReset() {
        //geocodeLatLong($scope.map,geocoder,infowindow,input);
        $scope.measurements = [];
        removeMarkers();

        //This builds URL based on if there is input in the necessary fields
        buildURL();

        $.getJSON($scope.url, function(data) {
            //console.log(data);
            for(i = 0; i < data.results.length; i++){
                $scope.formatted_JSON = {particle:'',measurement:'',date:'',coords:''};
                $scope.data=data.results[i];
                $scope.latlng = {lat: $scope.data.coordinates.latitude, lng:$scope.data.coordinates.longitude};
                $scope.formatted_JSON.particle = $scope.data.parameter;
                $scope.formatted_JSON.measurement = $scope.data.value;
                $scope.formatted_JSON.date = "04/4/2018";
                $scope.formatted_JSON.coords = "" + $scope.data.coordinates.latitude + "," + $scope.data.coordinates.longitude;

                addMarker($scope.latlng);

                $scope.measurements.push($scope.formatted_JSON);
            }
        });
    }

    $scope.request = function (date_picker,value_input) {

        //This sets these variables so we are able to check them when building the URL...
        $scope.date_picker = date_picker;
        $scope.value_input = value_input;

    };

    function buildURL(){
        //TODO: grab the inputs from the $scope.request
        $scope.url = "https://api.openaq.org/v1/measurements?coordinates="+ $scope.map.getCenter().lat()+","+ $scope.map.getCenter().lng()+"&radius="+$scope.radius+"&date_from="+"2018-4-4";

        if($scope.value_input !== undefined){
            $scope.url += "" //TODO: double check API
        }
        if($scope.date_picker !== undefined){
            $scope.url += "" //TODO: double check API
        }

    }

});

