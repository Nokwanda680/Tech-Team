document.addEventListener("DOMContentLoaded", function () {
    
    const map = L.map("map").setView([-33.9321,18.8602],14);
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:"&copy; OpenStreetMap contributors"
    }
).addTo(map);
var address = ["","",""];

L.marker([-33.93449,18.62997]).addTo(map).bindPopup("University of the Western Cape").openPopup();
L.marker([-33.93849,18.62799]).addTo(map).bindPopup("Unibel 1").openPopup();
L.marker([-33.93889,18.62789]).addTo(map).bindPopup("Unibel 2").openPopup();

L.Routing.control({waypoints: [L.latLng(lat,long),L.latLng(-33.9284,18.6279)],routeWhileDragging: true}).addTo(map);
});
const button = document.getElementById('search-btn');
button.addEventListener("click", async () => {
    const address = document.getElementById("address").value;
    if (!address.trim()) {
        alert("Please enter an address.");
        return;
    }
    var lat = document.getElementById('lat').value;
    var long = document.getElementById('long').value;
    L.marker([lat,long]).addTo(map).bindPopup('somewhere').openPopup();
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });
        const data = await response.json();

        if (data.length === 0) {
            document.getElementById("result").textContent = "Address not found.";
            return;
        }

        const latitude = data[0].lat;
        const longitude = data[0].lon;
        document.getElementById("result").innerHTML = `
            Latitude: ${latitude}<br>
            Longitude: ${longitude}`;
        //const Search = document.getElementById('findBtn');
        function co_ordinates() {
            const input = document.getElementById('input-address').value;
            

            
        };

        

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

    } catch (error) {
        console.error(error);
        alert("Error fetching coordinates.");
    }
});
console.log(L);
console.log(L.Routing);
