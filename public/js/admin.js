(function ($) {
  const VALID_BOROS = ["bronx", "brooklyn", "manhattan", "queens", "staten island"];

  function showFormError(form, message) {
    let errorDiv = form.find(".admin-form-error");
    if (!errorDiv.length) {
      errorDiv = $('<div class="formError admin-form-error" style="margin-bottom:8px;"></div>');
      form.prepend(errorDiv);
    }
    errorDiv.text(message).show();
    $("html, body").animate({ scrollTop: errorDiv.offset().top - 20 }, 150);
  }

  function hideFormError(form) {
    form.find(".admin-form-error").hide().text("");
  }
  function isDigitsOnly(str) {
    return /^\d+$/.test(str);
  }

  $("#createRestaurant-form").on("submit", function (event) {
    const form = $(this);
    hideFormError(form);

    // Name
    const name = $("#newRestaurantName").val().trim();
    if (!name) {
      event.preventDefault();
      showFormError(form, "Restaurant name is required.");
      $("#newRestaurantName").focus();
      return;
    }
    if (name.length > 35) {
      event.preventDefault();
      showFormError(form, "Restaurant name must be 35 characters or fewer.");
      $("#newRestaurantName").focus();
      return;
    }

    // Borough
    const boro = $("#newboro").val().trim().toLowerCase();
    if (boro === "select" || !VALID_BOROS.includes(boro)) {
      event.preventDefault();
      showFormError(form, "Please select a valid borough.");
      $("#newboro").focus();
      return;
    }

    // Building
    const building = $("#newBuilding").val().trim();
    if (!building) {
      event.preventDefault();
      showFormError(form, "Building number is required.");
      $("#newBuilding").focus();
      return;
    }
    if (building.length > 10) {
      event.preventDefault();
      showFormError(form, "Building number must be 10 characters or fewer.");
      $("#newBuilding").focus();
      return;
    }

    // Street
    const street = $("#newStreet").val().trim();
    if (!street) {
      event.preventDefault();
      showFormError(form, "Street name is required.");
      $("#newStreet").focus();
      return;
    }

    // Zip code
    const zip = $("#newZip").val().trim();
    if (!zip) {
      event.preventDefault();
      showFormError(form, "Zip code is required.");
      $("#newZip").focus();
      return;
    }
    if (zip.length !== 5 || !isDigitsOnly(zip)) {
      event.preventDefault();
      showFormError(form, "Zip code must be exactly 5 digits.");
      $("#newZip").focus();
      return;
    }

    // Phone
    const phone = $("#newPhone").val().trim();
    if (!phone) {
      event.preventDefault();
      showFormError(form, "Phone number is required.");
      $("#newPhone").focus();
      return;
    }
    if (phone.length !== 10 || !isDigitsOnly(phone)) {
      event.preventDefault();
      showFormError(form, "Phone number must be exactly 10 digits (numbers only, no dashes or spaces).");
      $("#newPhone").focus();
      return;
    }

    // Cuisine
    const cuisine = $("#newCuisine").val().trim();
    if (!cuisine) {
      event.preventDefault();
      showFormError(form, "Cuisine type is required.");
      $("#newCuisine").focus();
      return;
    }
    if (cuisine.length < 3 || cuisine.length > 15) {
      event.preventDefault();
      showFormError(form, "Cuisine must be between 3 and 15 characters.");
      $("#newCuisine").focus();
      return;
    }
  });


  $(document).on("submit", "form[name^='updateRestaurant-form-']", function (event) {
    const form = $(this);
    hideFormError(form);

    const restaurantId = form.attr("name").replace("updateRestaurant-form-", "");

    const nameInput = form.find(`#restaurantName-${restaurantId}`);
    const name = nameInput.val().trim();
    if (name && name.length > 35) {
      event.preventDefault();
      showFormError(form, "Restaurant name must be 35 characters or fewer.");
      nameInput.focus();
      return;
    }

    // Building 
    const buildingInput = form.find(`#building-${restaurantId}`);
    const building = buildingInput.val().trim();
    if (building && building.length > 10) {
      event.preventDefault();
      showFormError(form, "Building number must be 10 characters or fewer.");
      buildingInput.focus();
      return;
    }

    // Zip code
    const zipInput = form.find(`#zip-${restaurantId}`);
    const zip = zipInput.val().trim();
    if (zip && (zip.length !== 5 || !isDigitsOnly(zip))) {
      event.preventDefault();
      showFormError(form, "Zip code must be exactly 5 digits.");
      zipInput.focus();
      return;
    }

    // Phon
    const phoneInput = form.find(`#phone-${restaurantId}`);
    const phone = phoneInput.val().trim();
    if (phone && (phone.length !== 10 || !isDigitsOnly(phone))) {
      event.preventDefault();
      showFormError(form, "Phone number must be exactly 10 digits (numbers only).");
      phoneInput.focus();
      return;
    }

    // Cuisine
    const cuisineInput = form.find(`#cuisine-${restaurantId}`);
    const cuisine = cuisineInput.val().trim();
    if (cuisine && (cuisine.length < 3 || cuisine.length > 15)) {
      event.preventDefault();
      showFormError(form, "Cuisine must be between 3 and 15 characters.");
      cuisineInput.focus();
      return;
    }
  });


  $(document).on("submit", "form[name^='delete-form-']", function (event) {
    const form = $(this);
    hideFormError(form);

    const restaurantId = form.attr("name").replace("delete-form-", "");
    const confirmInput = form.find(`#restaurantDeletionId-${restaurantId}`);
    const typedId = confirmInput.val().trim();

    if (!typedId) {
      event.preventDefault();
      showFormError(form, "Please type the restaurant ID to confirm deletion.");
      confirmInput.focus();
      return;
    }

    if (typedId !== restaurantId) {
      event.preventDefault();
      showFormError(form, "The ID you entered does not match. Please copy it exactly.");
      confirmInput.val("").focus();
      return;
    }
  });
})(window.jQuery);
