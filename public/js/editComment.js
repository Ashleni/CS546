
// basically the same as newComment.js
(function ($) {
  $("form.comment-form").on("submit", function (event) {
    let errorDiv = $(".form-error-banner");
    if (!errorDiv.length) {
      errorDiv = $('<div class="form-error-banner"></div>');
      $(this).prepend(errorDiv);
    }
    errorDiv.hide().text("");

    const messageInput = $("#message");
    const message = messageInput.val().trim();

    if (!message) {
      event.preventDefault();
      errorDiv.text("Your comment cannot be empty.").show();
      messageInput.focus();
      return;
    }

    let repeatingChar = null;
    let occurrence = 1;

    for (let i = 0; i < message.length - 1; i++) {
      const curr = message[i];
      const next = message[i + 1];

      if (curr === repeatingChar) {
        occurrence++;
        if (occurrence >= 5) {
          event.preventDefault();
          errorDiv
            .text("Your comment cannot have 5 or more of the same character in a row.")
            .show();
          messageInput.focus();
          return;
        }
      } else if (curr === next) {
        repeatingChar = curr;
        occurrence = 2;
      } else {
        repeatingChar = null;
        occurrence = 1;
      }
    }
  });
})(window.jQuery);
