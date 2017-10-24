var state = {}

var config = {
    apiKey: "AIzaSyAuajRA39YswspRZhJUdi503b6P_pVlkOo",
    authDomain: "savetrek.firebaseapp.com",
    databaseURL: "https://savetrek.firebaseio.com"
};
firebase.initializeApp(config);
var database = firebase.database();
var map;

function initMap() {
    // var uluru = {lat: -25.363, lng: 131.044};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: new google.maps.LatLng(19.425004, -99.126457)
    });
    getFirebase('/demander/', "https://s3-us-west-2.amazonaws.com/savetrek.org/savetrek/img/red.png");
    getFirebase('/supplier/', "https://s3-us-west-2.amazonaws.com/savetrek.org/savetrek/img/yellow.png");
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

}

function isRequester(){
    state.isSupplier = false;
    $("#intro").hide();
    document.getElementById("submitform").hidden = false;
};
function isSupplier(){
    state.isSupplier = true;
    $("#intro").hide();
    document.getElementById("submitform").hidden = false;
};

function getFirebase(userType, icon){
    firebase.database().ref(userType).once('value').then(function (snapshot) {
        let demanders = snapshot.val();
        let locations = Object.keys(demanders).reduce(function (retList, town) {
            retList.push([
                parseFloat(demanders[town].lat),
                parseFloat(demanders[town].lng),
                demanders[town].townName,
                demanders[town].name,
                demanders[town].description,
                demanders[town].resource
            ]);
            return retList;
        },
            []
        );

        var infowindow = new google.maps.InfoWindow();
        var marker, i;
        for (i = 0; i < locations.length; i++) {
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(locations[i][0], locations[i][1]),
                map: map,
                icon: icon
            });

            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                return function () {
                    infowindow.setContent(locations[i][2]);
                    infowindow.open(map, marker);
                    $("#sidebar").empty();
                    var content = '<div id="title">SAVETREK</div><div id="townDetail"><h2>' + locations[i][2] + '</h2> <h5>Editor: ' + locations[i][3] + '</h5><p id="editTownInfo" onclick="return editTownInfo()" class="text-right">edit</p> <table class="table"> <tbody> <tr> <td>Water</td><td id="waterVal">'+locations[i][5].water +'</td><td>Liters</td></tr><tr> <td>Food</td><td id="foodVal">'+locations[i][5].food+'</td><td>Serving</td></tr><tr> <td>Shelter</td><td id="shelterVal">'+locations[i][5].shelter+'</td><td>People</td></tr><tr> <td>Volenteer</td><td id="volenteerVal">'+locations[i][5].volunteers+'</td><td>People</td></tr><tr> <td>Flashlights</td><td id="lightVal">'+locations[i][5].lights+'</td><td>Items</td></tr><tr> <td>First Aid Kits</td><td id="kitVal">'+locations[i][5].kits+'</td><td>People</td></tr></tbody></table><button class="btn btn-primary" id="changeEdit" hidden="true" type="button">Send</button><hr><h4>Comments</h4><p>' + locations[i][4] + '</p><div class="input-group"> <input type="text" class="form-control" placeholder="Write your comments here..." aria-label="Search for..."> <span class="input-group-btn"> <button class="btn btn-primary" type="button">Send</button> </span> </div><hr><h4>Delivery System</h4><div class="input-group"> <input type="text" class="form-control" placeholder="Write your comments here..." aria-label="Search for..."> <span class="input-group-btn">  </span> </div></div>';
                    $("#sidebar").html(content);

                }
            })(marker, i));
        }
    });
}

var placeSearch, autocomplete;
var componentForm = {
  name: 'short_name',
  locality: 'long_name',
  administrative_area_level_1: 'short_name',
  country: 'long_name',
  water: 'short_name',
  food: 'short_name',
  shelter: 'short_name',
  volunteers: 'short_name',
  lights: 'short_name',
  kits: 'short_name',
  description: 'short_name'
};

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
    /** @type {!HTMLInputElement} */
    (document.getElementById('autocomplete')), {
      types: ['geocode']
    });

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.
  autocomplete.addListener('place_changed', fillInAddress);
}

function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();

  for (var component in componentForm) {
  	document.getElementById(component).value = '';
    document.getElementById(component).disabled = false;
  }

  // Get each component of the address from the place details
  // and fill the corresponding field on the form.
  for (var i = 0; i < place.address_components.length; i++) {
    var addressType = place.address_components[i].types[0];
    if (componentForm[addressType]) {
      var val = place.address_components[i][componentForm[addressType]];
      document.getElementById(addressType).value = val;
    }
  }

  // Add longitude and latitude
  document.getElementById('latitude').value = place.geometry.location.lat();
  document.getElementById('longitude').value = place.geometry.location.lng();
}

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

// Populate DB
function submit() {
  let t = state.isSupplier ? 'supplier/' : 'demander/';
  console.log("in");
  firebase.database().ref(t + document.getElementById('locality').value + "_" + document.getElementById('name').value).set({
    name: document.getElementById('name').value,
    townName: document.getElementById('locality').value,
    lat: document.getElementById('latitude').value,
    lng: document.getElementById('longitude').value,
    resource:{
      water: document.getElementById('water').value,
      food: document.getElementById('food').value,
      shelter: document.getElementById('shelter').value,
      volunteers: document.getElementById('volunteers').value,
      lights: document.getElementById('lights').value,
      kits: document.getElementById('kits').value
    },
    description: document.getElementById('description').value
  });
  window.location.reload();
  return false;
}

function callGoogleMaps() {
    initMap();
    initAutocomplete();
}

function editTownInfo(){
    $('#changeEdit').removeAttr('hidden');
    var waterVal = $("#waterVal")[0].innerText;
    var foodVal = $("#foodVal")[0].innerText;
    var shelterVal = $("#shelterVal")[0].innerText;
    var volenteerVal = $("#volenteerVal")[0].innerText;
    var lightVal = $("#lightVal")[0].innerText;
    var kitVal = $("#kitVal")[0].innerText;

    $("#waterVal").empty();
    $("#foodVal").empty();
    $("#shelterVal").empty();
    $("#volenteerVal").empty();
    $("#lightVal").empty();
    $("#kitVal").empty();

    var waterInput = $("<input type='text' class='form-control'>");
    var foodInput = $("<input type='text'class='form-control'>");
    var shelterInput = $("<input type='text' class='form-control'>");
    var volenteerInput = $("<input type='text' class='form-control'>");
    var lightInput = $("<input type='text' class='form-control'>");
    var kitInput = $("<input type='text' class='form-control'>");

    waterInput.val(waterVal);
    foodInput.val(foodVal);
    shelterInput.val(shelterVal);
    volenteerInput.val(volenteerVal);
    lightInput.val(lightVal);
    kitInput.val(kitVal);


    $("#waterVal").append(waterInput);
    $("#foodVal").append(foodInput);
    $("#shelterVal").append(shelterInput);
    $("#volenteerVal").append(volenteerInput);
    $("#lightVal").append(lightInput);
    $("#kitVal").append(kitInput);
}