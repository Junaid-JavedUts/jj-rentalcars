document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");
  const suggestionsList = document.getElementById("suggestions");
  const brandFilter = document.getElementById("brandFilter");
  const typeFilter = document.getElementById("typeFilter");
  const carGrid = document.getElementById("car-grid");
  let allCars = [];

  if (searchBox && carGrid) {
    fetch("cars.json")
      .then(response => response.json())
      .then(data => {
        allCars = data.cars;
        localStorage.setItem("carsData", JSON.stringify(allCars));
        populateFilters(allCars);
        displayCars(allCars);
      })
      .catch(error => {
        console.error("Error loading car data:", error);
      });

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
          <button class="rent-button" data-vin="${car.vin}" ${!car.available ? "disabled" : ""}>
            ${car.available ? "Rent" : "Rent"}
          </button>
        `;
        const rentButton = card.querySelector(".rent-button");
        rentButton?.addEventListener("click", () => {
          localStorage.setItem("selectedCar", JSON.stringify(car));
          window.location.href = "reservations.html";
        });
        carGrid.appendChild(card);
      });
    }

    function applyFilters() {
      const searchTerm = searchBox.value.trim().toLowerCase();
      const selectedBrand = brandFilter.value;
      const selectedType = typeFilter.value;
      const filtered = allCars.filter(car => {
        const keywordMatch =
          car.carModel.toLowerCase().includes(searchTerm) ||
          car.brand.toLowerCase().includes(searchTerm) ||
          car.carType.toLowerCase().includes(searchTerm) ||
          car.description.toLowerCase().includes(searchTerm);
        const brandMatch = selectedBrand ? car.brand === selectedBrand : true;
        const typeMatch = selectedType ? car.carType === selectedType : true;
        return keywordMatch && brandMatch && typeMatch;
      });
      displayCars(filtered);
    }

    searchBox.addEventListener("input", () => {
      const input = searchBox.value.trim().toLowerCase();
      suggestionsList.innerHTML = "";
      if (input.length < 2) return;
      const keywords = new Set();
      allCars.forEach(car => {
        if (car.carModel.toLowerCase().includes(input)) keywords.add(car.carModel);
        if (car.brand.toLowerCase().includes(input)) keywords.add(car.brand);
        if (car.carType.toLowerCase().includes(input)) keywords.add(car.carType);
        car.description.toLowerCase().split(" ").forEach(word => {
          if (word.includes(input)) keywords.add(word);
        });
      });
      [...keywords].slice(0, 5).forEach(suggestion => {
        const li = document.createElement("li");
        li.textContent = suggestion;
        li.classList.add("suggestion-item");
        li.addEventListener("click", () => {
          searchBox.value = suggestion;
          suggestionsList.innerHTML = "";
          applyFilters();
        });
        suggestionsList.appendChild(li);
      });
    });

    brandFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);
    searchBox.addEventListener("input", applyFilters);
  }

  const bookingForm = document.getElementById("bookingForm");
  const totalCostEl = document.getElementById("totalCost");
  const carDetails = document.getElementById("car-details");
  const reservationForm = document.getElementById("reservation-form");
  const car = JSON.parse(localStorage.getItem("selectedCar"));

  if (bookingForm && car) {
    carDetails.innerHTML = `
      <img src="${car.image}" alt="${car.carModel}">
      <h3>${car.brand} ${car.carModel} (${car.yearOfManufacture})</h3>
      <p><strong>Fuel:</strong> ${car.fuelType}</p>
      <p><strong>Type:</strong> ${car.carType}</p>
      <p><strong>Price per day:</strong> $${car.pricePerDay}</p>
      <p>${car.description}</p>
    `;

    const nameEl = document.getElementById("customerName");
    const phoneEl = document.getElementById("customerPhone");
    const emailEl = document.getElementById("customerEmail");
    const licenseEl = document.getElementById("licenseNumber");
    const pickupEl = document.getElementById("pickupDate");
    const returnEl = document.getElementById("returnDate");
    const submitBtn = document.getElementById("submitButton");
    const cancelBtn = document.getElementById("cancelButton");

    const saved = JSON.parse(localStorage.getItem("formDraft"));
    if (saved) {
      nameEl.value = saved.customerName || "";
      phoneEl.value = saved.customerPhone || "";
      emailEl.value = saved.customerEmail || "";
      licenseEl.value = saved.licenseNumber || "";
      pickupEl.value = saved.pickupDate || "";
      returnEl.value = saved.returnDate || "";
    }

    const validateField = (input, isValid) => {
      input.classList.remove("valid", "invalid");
      input.classList.add(isValid ? "valid" : "invalid");
    };

    const validateInput = () => {
      const nameValid = /^[a-zA-Z\s]{2,}$/.test(nameEl.value.trim());
      const phoneValid = /^\d{10,15}$/.test(phoneEl.value.trim());
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
      const licenseValid = licenseEl.value.trim().length > 0;
      const pickup = pickupEl.value;
      const ret = returnEl.value;
      const dateValid = pickup && ret && new Date(ret) > new Date(pickup);

      validateField(nameEl, nameValid);
      validateField(phoneEl, phoneValid);
      validateField(emailEl, emailValid);
      validateField(licenseEl, licenseValid);
      validateField(pickupEl, !!pickup);
      validateField(returnEl, dateValid);

      submitBtn.disabled = !(nameValid && phoneValid && emailValid && licenseValid && dateValid);
    };

    bookingForm.addEventListener("input", () => {
      validateInput();
      const pickup = new Date(pickupEl.value);
      const ret = new Date(returnEl.value);
      const days = Math.ceil((ret - pickup) / (1000 * 60 * 60 * 24));
      const cost = days > 0 ? car.pricePerDay * days : 0;
      totalCostEl.textContent = cost;
    });

    cancelBtn.addEventListener("click", () => {
      bookingForm.reset();
      document.querySelectorAll("input").forEach(input => {
        input.classList.remove("valid", "invalid");
      });
      totalCostEl.textContent = "0";
      localStorage.removeItem("formDraft");
      validateInput();
    });

    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const cars = JSON.parse(localStorage.getItem("carsData")) || [];
      const selectedIndex = cars.findIndex(c => c.vin === car.vin);
      if (selectedIndex === -1 || !cars[selectedIndex].available) {
        alert("❌ Reservation failed! This car is no longer available.");
        return;
      }

      const newOrder = {
        carVin: car.vin,
        customerName: nameEl.value.trim(),
        customerPhone: phoneEl.value.trim(),
        customerEmail: emailEl.value.trim(),
        licenseNumber: licenseEl.value.trim(),
        pickupDate: pickupEl.value,
        returnDate: returnEl.value,
        totalCost: totalCostEl.textContent
      };

      const existing = JSON.parse(localStorage.getItem("orders")) || [];
      existing.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(existing));

      if (selectedIndex !== -1) {
        cars[selectedIndex].available = false;
        localStorage.setItem("carsData", JSON.stringify(cars));
      }

      localStorage.removeItem("selectedCar");
      localStorage.removeItem("formDraft");
      alert("✅ Reservation confirmed!");
      window.location.href = "index.html";
    });

    window.addEventListener("beforeunload", () => {
      const draft = {
        customerName: nameEl.value.trim(),
        customerPhone: phoneEl.value.trim(),
        customerEmail: emailEl.value.trim(),
        licenseNumber: licenseEl.value.trim(),
        pickupDate: pickupEl.value,
        returnDate: returnEl.value
      };
      localStorage.setItem("formDraft", JSON.stringify(draft));
    });

    validateInput();
  }

  if (!car && carDetails && reservationForm) {
    carDetails.innerHTML = "<h2>No car selected. Please choose a car from the homepage.</h2>";
    reservationForm.style.display = "none";
  }
});
