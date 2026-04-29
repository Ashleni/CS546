$("newComment-form").submit((event) => {
  $("#error").hide();

  let message = $("#message").val().trim();

  if (!message) {
    event.preventDefault();
    $("#error").text("Your comment can't be empty!");
    $("#error").show();
    $("#message").focus();
    return;
  }

  let repeatingChar = null;
  let occurance = 1;

  for (let i = 0; i < message.length - 1; i++) {
    let currChar = message[i];
    let nextChar = message[i + 1];
    if (currChar == repeatingChar) {
      occurance += 1;
      if (occurance == 5) {
        event.preventDefault();
        $("#error").text("Your comment can't have repeating characters!");
        $("#error").show();
        $("#message").focus();
        return;
      }
    } else if (currChar == nextChar && currChar != repeatingChar) {
      repeatingChar = currChar;
      occurance = 2;
    } else occurance = 1;
  }
});
