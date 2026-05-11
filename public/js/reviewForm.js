(function ($) {
  const SCALE_QUESTIONS = [
    "diningAreaCleanliness",
    "restroomCleanliness",
    "staffHygiene",
    "overallExperience",
  ];
  const CHOICE_QUESTIONS = {
    foodHandlingPractices: ["yes", "no", "not_observed"],
    foodTemperature: ["yes", "no", "unsure"],
    pestSighting: ["yes", "no"],
  };
  const VALID_SCALE_VALUES = ["1", "2", "3", "4", "5"];
  function showError(message, focusSelector) {
    let banner = $(".form-error-banner");
    if (!banner.length) {
      banner = $('<div class="form-error-banner"></div>');
      $("form").first().prepend(banner);
    }
    banner.text(message).show();
    if (focusSelector) {
      $(focusSelector).focus();
    }
    $("html, body").animate({ scrollTop: banner.offset().top - 20 }, 200);
  }

  function hideError() {
    $(".form-error-banner").hide().text("");
  }

  $("form.full-review-form").on("submit", function (event) {
    hideError();
    const ratingVal = $("#rating").val().trim();
    if (ratingVal === "") {
      event.preventDefault();
      showError("Please provide a rating.", "#rating");
      return;
    }
    const rating = parseFloat(ratingVal);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      event.preventDefault();
      showError("Rating must be a number between 0 and 5.", "#rating");
      return;
    }
    const reviewText = $("#reviewText").val().trim();
    if (!reviewText) {
      event.preventDefault();
      showError("Please write something in your review.", "#reviewText");
      return;
    }
    if (reviewText.length < 10) {
      event.preventDefault();
      showError("Your review must be at least 10 characters.", "#reviewText");
      return;
    }
    const photoInput = document.getElementById("photos");
    if (photoInput && photoInput.files && photoInput.files.length > 0) {
      const files = photoInput.files;

      if (files.length > 3) {
        event.preventDefault();
        showError("You may upload a maximum of 3 photos.");
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxBytes = 5 * 1024 * 1024; // 5 MB

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
          event.preventDefault();
          showError(
            `"${file.name}" is not a supported image type. Use JPEG, PNG, or WEBP.`
          );
          return;
        }
        if (file.size > maxBytes) {
          event.preventDefault();
          showError(`"${file.name}" exceeds the 5 MB size limit.`);
          return;
        }
      }
    }
    for (const key of SCALE_QUESTIONS) {
      const selected = $(`input[name="${key}"]:checked`).val();
      if (!selected || !VALID_SCALE_VALUES.includes(selected)) {
        event.preventDefault();
                const questionEl = $(`input[name="${key}"]`).closest(".survey-question");
        showError(
          "Please answer all survey questions before submitting.",
          null
        );
        if (questionEl.length) {
          $("html, body").animate(
            { scrollTop: questionEl.offset().top - 20 },
            200
          );
        }
        return;
      }
    }

    for (const [key, validValues] of Object.entries(CHOICE_QUESTIONS)) {
      const selected = $(`input[name="${key}"]:checked`).val();
      if (!selected || !validValues.includes(selected)) {
        event.preventDefault();
        const questionEl = $(`input[name="${key}"]`).closest(".survey-question");
        showError(
          "Please answer all survey questions before submitting.",
          null
        );
        if (questionEl.length) {
          $("html, body").animate(
            { scrollTop: questionEl.offset().top - 20 },
            200
          );
        }
        return;
      }
    }
  });
})(window.jQuery);
