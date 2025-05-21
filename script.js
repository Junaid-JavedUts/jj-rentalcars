document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");
  const suggestionsList = document.getElementById("suggestions");
  const brandFilter = document.getElementById("brandFilter");
  const typeFilter = document.getElementById("typeFilter");
  const carGrid = document.getElementById("car-grid");

  let allCars = [];

  // Load cars from JSON
  fetch("cars.json")
    .then(response => response.json())
    .then(data => {
      allCars = data.cars;
      populateFilters(allCars);
      displayCars(allCars);
    })
    .catch(error => {
      console.error("Error loading car data:", error);
    });

  // Populate brand and type dropdowns
  function populateFilters(cars) {
    const brands = [...new Set(cars.map(car => car.brand))];
    const types = [...new Set(cars.map(car => car.carType))];

    brands.forEach(brand => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      brandFilter.appendChild(opt);
    });

    types.forEach(type => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type;
      typeFilter.appendChild(opt);
    });
  }

  // Display cars in the grid
  function displayCars(cars) {
    carGrid.innerHTML = "";
    if (cars.length === 0) {
      carGrid.innerHTML = "<p>No cars match your search/filter.</p>";
      return;
    }

    cars.forEach(car => {
      const card = document.createElement("div");
      card.className = "car-card";

      card.innerHTML = `
        <img src="${car.image}" alt="${car.carModel}">
        <h3>${car.brand} ${car.carModel} (${car.yearOfManufacture})</h3>
        <p><strong>Type:</strong> ${car.carType}</p>
        <p><strong>Fuel:</strong> ${car.fuelType}</p>
        <p><strong>Price:</strong> $${car.pricePerDay} / day</p>
        <p>${car.description}</p>
        <button class="rent-button" data-vin="${car.vin}" ${!car.available ? "disabled" : ""}>Rent</button>
      `;

      const rentButton = card.querySelector(".rent-button");
      rentButton?.addEventListener("click", () => {
        localStorage.setItem("selectedCar", JSON.stringify(car));
        window.location.href = "reservations.html";
      });

      carGrid.appendChild(card);
    });
  }

  // Filter + Search logic
  function applyFilters() {
    const searchTerm = searchBox.value.trim().toLowerCase();
    const selectedBrand = brandFilter.value;
    const selectedType = typeFilter.value;

    let filtered = allCars.filter(car => {
      const matchesKeyword =
        car.carModel.toLowerCase().includes(searchTerm) ||
        car.brand.toLowerCase().includes(searchTerm) ||
        car.carType.toLowerCase().includes(searchTerm) ||
        car.description.toLowerCase().includes(searchTerm);

      const matchesBrand = selectedBrand ? car.brand === selectedBrand : true;
      const matchesType = selectedType ? car.carType === selectedType : true;

      return matchesKeyword && matchesBrand && matchesType;
    });

    displayCars(filtered);
  }

  // Live search suggestions
  searchBox.addEventListener("input", () => {
    const input = searchBox.value.trim().toLowerCase();
    suggestionsList.innerHTML = "";

    if (input.length < 2) return;

    const keywords = new Set();

    allCars.forEach(car => {
      if (car.carModel.toLowerCase().includes(input)) keywords.add(car.carModel);
      if (car.brand.toLowerCase().includes(input)) keywords.add(car.brand);
      if (car.carType.toLowerCase().includes(input)) keywords.add(car.carType);
      if (car.description.toLowerCase().includes(input)) {
        car.description.toLowerCase().split(" ").forEach(word => {
          if (word.includes(input)) keywords.add(word);
        });
      }
    });

    [...keywords].slice(0, 5).forEach(suggestion => {
      const li = document.createElement("li");
      li.textContent = suggestion;
      li.addEventListener("click", () => {
        searchBox.value = suggestion;
        suggestionsList.innerHTML = "";
        applyFilters();
      });
      suggestionsList.appendChild(li);
    });

    applyFilters();
  });

  // Trigger filter when dropdowns change
  brandFilter.addEventListener("change", applyFilters);
  typeFilter.addEventListener("change", applyFilters);

  // === Reservation page validation ===
  const bookingForm = document.getElementById("bookingForm");
  const totalCostEl = document.getElementById("totalCost");
  const car = JSON.parse(localStorage.getItem("selectedCar"));

  if (bookingForm && car) {
    document.getElementById("car-details").innerHTML = `
      <img src="${car.image}" alt="${car.carModel}">
      <h3>${car.brand} ${car.carModel} (${car.yearOfManufacture})</h3>
      <p><strong>Fuel:</strong> ${car.fuelType}</p>
      <p><strong>Type:</strong> ${car.carType}</p>
      <p><strong>Price per day:</strong> $${car.pricePerDay}</p>
      <p>${car.description}</p>
    `;

    bookingForm.addEventListener("input", () => {
      const pickup = new Date(document.getElementById("pickupDate").value);
      const ret = new Date(document.getElementById("returnDate").value);
      const days = Math.ceil((ret - pickup) / (1000 * 60 * 60 * 24));
      const cost = days > 0 ? car.pricePerDay * days : 0;
      totalCostEl.textContent = cost;
    });

    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("customerName").value.trim();
const phone = document.getElementById("customerPhone").value.trim();
const email = document.getElementById("customerEmail").value.trim();
const license = document.getElementById("licenseNumber").value.trim();

      const pickup = document.getElementById("pickupDate").value;
      const ret = document.getElementById("returnDate").value;

      const nameRegex = /^[a-zA-Z\s]+$/;
      const phoneRegex = /^\d{10,15}$/;

      if (!nameRegex.test(name)) {
        alert("Please enter a valid full name (letters and spaces only).");
        return;
      }

      if (!phoneRegex.test(phone)) {
        alert("Please enter a valid phone number (10 to 15 digits).");
        return;
      }

      if (!pickup || !ret) {
        alert("Please select both pickup and return dates.");
        return;
      }

      if (new Date(ret) <= new Date(pickup)) {
        alert("Return date must be after pickup date.");
        return;
      }

      const days = Math.ceil((new Date(ret) - new Date(pickup)) / (1000 * 60 * 60 * 24));
      const total = days > 0 ? car.pricePerDay * days : 0;

      const newOrder = {
  carVin: car.vin,
  customerName: name,
  customerPhone: phone,
  customerEmail: email,
  licenseNumber: license,
  pickupDate: pickup,
  returnDate: ret,
  totalCost: total
};


      const existing = JSON.parse(localStorage.getItem("orders")) || [];
      existing.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(existing));

      alert("Reservation confirmed!");
      localStorage.removeItem("selectedCar");
      window.location.href = "index.html";
    });
  }
});
