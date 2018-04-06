// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map;
var markers=[];
var markerLocations = [];

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
    //var types = document.getElementById('type-selector');
    //var strictBounds = document.getElementById('strict-bounds-selector');

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

var infoWindows = [];




app.controller('ctr1', function ($scope) {

    function removeMarkers(){

        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
        markerLocations=[];

/*
        for(i=0;i<markers.length;i++){
            var distance = google.maps.geometry.spherical.computeDistanceBetween($scope.map.getCenter(), markers[i].getPosition());
            if(distance > $scope.radius){
                markers.splice(i,1);
            }
        }
*/
    }

    var searchParams = [];
    for(i = 0; i < 7; i ++){
        searchParams[i] = false;
    }

    var google_interval = setInterval(function() {

        if(map !== undefined)
        {
            clearInterval(google_interval);
            $scope.map = map;

            panReset();

            //this essentially sets up the map window with the API call.

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

/*
    //TODO:

    function addInfoWindow(information) {

        infowindow = new google.maps.InfoWindow({
            position: information.location,
            content: information.measurement + " " information.value
        });

        marker.addListener('hover', function(){
            infowindow.open($scope.map,marker);
        });
    }

*/
    function addMarker(location) {
        marker = new google.maps.Marker({
            position: location,
            map:$scope.map
        });
        markerLocations.push(location);
        markers.push(marker);
    }

    function panReset(){

        $scope.bounds = $scope.map.getBounds();
        $scope.center = $scope.map.getCenter();

        $scope.ne = $scope.bounds.getNorthEast();

        $scope.radius = google.maps.geometry.spherical.computeDistanceBetween($scope.center, $scope.ne);

        //We do the same thing except change the radius so no need have it 2 places
        dragReset();

    }

    function dragReset() {
        removeMarkers();
        $scope.measurements = [];
        buildURL();

        $.getJSON($scope.url, function(data) {

            for(i = 0; i < data.results.length; i++){
                //initialize data so we can use it more simply
                $scope.data=data.results[i];
                $scope.latlng = {lat: $scope.data.coordinates.latitude, lng:$scope.data.coordinates.longitude};
                //adds marker of current result
                //addMarker($scope.latlng);

                //if($.inArray($scope.latlng, markerLocations) < 0){
                    addMarker($scope.latlng);
                //}
                //puts data from current result into JSON format to use to interate through table
                $scope.formatted_JSON = {particle:'',measurement:'',date:'',coords:''};
                $scope.formatted_JSON.particle = $scope.data.parameter;
                $scope.formatted_JSON.measurement = $scope.data.value +" "+$scope.data.unit;
                $scope.formatted_JSON.date = utcToString($scope.data.date.utc);
                $scope.formatted_JSON.coords = $scope.data.location;//"" + $scope.data.coordinates.latitude + "," + $scope.data.coordinates.longitude;

                $scope.measurements.push($scope.formatted_JSON);
            }

            $scope.markerCluster = new MarkerClusterer($scope.map, markers,
                {
                    styles: [
                        {
                            textColor: 'white',
                            url: 'm/m1.png',
                            height: 52,
                            width: 53
                        },
                        {
                            textColor: 'white',
                            url: 'm/m2.png',
                            height: 55,
                            width: 56
                        },
                        {
                            textColor: 'white',
                            url: 'm/m3.png',
                            height: 65,
                            width: 66
                        },
                        {
                            textColor: 'white',
                            url: 'm/m4.png',
                            height: 77,
                            width: 78
                        },
                        {
                            textColor: 'white',
                            url: 'm/m5.png',
                            height: 89,
                            width: 90
                        }
                    ]
                });

            $scope.$apply();
        });

    }

    $scope.request = function (map,date_from,date_to,from_value,to_value,arr) {
        //This sets these variables so we are able to check them when building the URL...
        $scope.date_from = date_from;
        $scope.date_to = date_to;

        $scope.from_value = from_value;
        $scope.to_value = to_value;
        $scope.map = map;
        searchParams = arr;
        panReset();

        //TODO search through array to get which particles to seach for.

    };

    function buildURL(){
        //TODO: grab the inputs from the $scope.request

        $scope.url = "https://api.openaq.org/v1/measurements?coordinates="+ $scope.map.getCenter().lat()+","+ $scope.map.getCenter().lng()+"&radius="+$scope.radius;


        if($scope.from_value !== undefined){
            $scope.url += "&value_from="+$scope.from_value;
        }

        if($scope.to_value !== undefined){
            $scope.url += "&value_to="+$scope.to_value
        }

        if($scope.date_from !== undefined){

            $scope.url+="&date_from="+dateString($scope.date_from);
        }

        if($scope.date_to !== undefined){
            $scope.url+="&date_to="+dateString($scope.date_to);
        }


        if(searchParams)
        {
            var count = 0;

            for(i=0; i<7; i++){
                if(searchParams[i] === true){
                    count++;
                }
            }

            if( searchParams[0] === true){
                if(count === 1){
                    $scope.url += "&parameter=co";
                }
                else{
                    $scope.url+="&parameter[]=co";
                }
            }
            if(searchParams[1] === true){
                if(count === 1){
                    $scope.url += "&parameter=so2";
                }
                else{
                    $scope.url+="&parameter[]=so2";
                }
            }

            if(searchParams[2] === true){
                if(count === 1){
                    $scope.url += "&parameter=pm25";
                }
                else{
                    $scope.url+="&parameter[]=pm25";
                }
            }
            if(searchParams[3] === true){
                if(count === 1){
                    $scope.url += "&parameter=pm10";
                }
                else{
                    $scope.url+="&parameter[]=pm10";
                }
            }
            if(searchParams[4] === true){
                if(count === 1){
                    $scope.url += "&parameter=o3";
                }
                else{
                    $scope.url+="&parameter[]=o3";
                }
            }
            if(searchParams[5] === true){
                if(count === 1){
                    $scope.url += "&parameter=no2";
                }
                else{
                    $scope.url+="&parameter[]=no2";
                }
            }
            if(searchParams[6] === true){
                if(count === 1){
                    $scope.url += "&parameter=bc";
                }
                else{
                    $scope.url+="&parameter[]=bc";
                }
            }
        }

        $scope.url+="&limit=10000"
        //console.log($scope.url);
    }

    function dateString(date){

        var month = date.getMonth()+1;
        var day = date.getDate();

        var minutes = date.getMinutes();
        var hours = date.getHours();

        if(month < 10){
            month = '0'+month;
        }
        if(day < 10){
            day = '0'+day;
        }
        if(hours < 10){
            hours = '0'+hours;
        }
        if(minutes < 10){
            minutes = '0'+minutes;
        }

        //console.log(date.getFullYear()+"-"+month+"-"+day+"T"+hours+":"+minutes+":00");
        return date.getFullYear()+"-"+month+"-"+day+"T"+hours+":"+minutes+":00";

    }

    function utcToString(date){

        return date.substring(0,10)+" "+date.substring(11,19);

    }



});

