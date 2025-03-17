let laptops = [];

function fetchLaptops() {
    fetch('/api/laptops')
        .then(response => response.json())
        .then(data => {
            laptops = data;
            displayLaptops();
        })
        .catch(error => console.error('Error fetching laptops:', error));
}

function initializeBanner() {
    const banner = document.getElementById("banner");
    if (banner) {
        // ...existing code...
    } else {
        console.error('Banner element not found');
    }
}

// Removed unused function getMockLaptops

function displayLaptops() {
    // ...existing code...
}

// ...existing code...
