document.addEventListener("DOMContentLoaded", function () {
    //var lat = document.getElementById('lat').value;
    //var long = document.getElementById('long').value;
    const map = L.map("map").setView([-33.9321,18.8602],14);
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:"&copy; OpenStreetMap contributors"
    }
).addTo(map);

L.marker([-33.93449,18.62997]).addTo(map).bindPopup("University of the Western Cape").openPopup();
//L.marker([53.4733578,-2.2163096]).addTo(map).bindPopup('Unibel 1').openPopup();
L.marker([lat,long]).addTo(map).bindPopup('somewhere').openPopup();
L.Routing.control({waypoints: [L.latLng(lat,long),L.latLng(-33.9284,18.6279)],routeWhileDragging: true}).addTo(map);
});
document.getElementById("findBtn").addEventListener("click", async () => {
    const address = document.getElementById("address").value;
    if (!address.trim()) {
        alert("Please enter an address.");
        return;
    }
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
            Longitude: ${longitude}
        `;

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

    } catch (error) {
        console.error(error);
        alert("Error fetching coordinates.");
    }
});
console.log(L);
console.log(L.Routing);
