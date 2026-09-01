let map; // module-scope so it's usable outside DOMContentLoaded
let routingControl; // keep a reference so we can replace the route on each click

const UWC_COORDS = [-33.93449, 18.62997];

document.addEventListener("DOMContentLoaded", function () {

    map = L.map("map").setView([-33.9321, 18.8602], 14);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors" }
    ).addTo(map);

    var address = ["", "", ""];

    // UWC marker itself — no routing needed, it's the destination
    L.marker(UWC_COORDS).addTo(map).bindPopup("University of the Western Cape").openPopup();

    // Helper: attach a "route to UWC on click" handler to a marker
    function addRoutableMarker(coords, label) {
        const marker = L.marker(coords).addTo(map).bindPopup(label);

        marker.on("click", function () {
            // Remove any existing route before drawing a new one
            if (routingControl) {
                map.removeControl(routingControl);
            }

            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(coords[0], coords[1]),
                    L.latLng(UWC_COORDS[0], UWC_COORDS[1])
                ],
                routeWhileDragging: true
            }).addTo(map);
        });

        return marker;
    }

    addRoutableMarker([-33.93849, 18.62799], "Unibel 1");
    addRoutableMarker([-33.93889, 18.62789], "Unibel 2");
});

const button = document.getElementById('search-btn');
button.addEventListener("click", async () => {
    const address = document.getElementById("address").value;
    if (!address.trim()) {
        alert("Please enter an address.");
        return;
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}`;
        const response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });
        const data = await response.json();

        if (data.length === 0) {
            document.getElementById("result").textContent = "Address not found.";
            return;
        }

        const latitude = parseFloat(data[0].lat);
        const longitude = parseFloat(data[0].lon);

        document.getElementById("result").innerHTML = `
            Latitude: ${latitude}<br>
            Longitude: ${longitude}`;

        // Place a marker at the searched address and make it routable too
        const marker = L.marker([latitude, longitude]).addTo(map).bindPopup(address).openPopup();
        marker.on("click", function () {
            if (routingControl) {
                map.removeControl(routingControl);
            }
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(latitude, longitude),
                    L.latLng(UWC_COORDS[0], UWC_COORDS[1])
                ],
                routeWhileDragging: true
            }).addTo(map);
        });

        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

    } catch (error) {
        console.error(error);
        alert("Error fetching coordinates.");
    }
});