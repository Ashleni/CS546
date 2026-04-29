$("#signin-form").submit((event) => {
  $("#error").hide();

  let usernameRegex = /^[A-Za-z0-9_.]{3,30}$/;
  let passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

  // username
  let username = $("#username").val().trim().toLowerCase();

  if (!username || !usernameRegex.test(username)) {
    event.preventDefault();
    $("#error").text("Either the Username or Password is invalid!");
    $("#error").show();
    $("#username").focus();
    return;
  }

  // password
  let password = $("#password").val().trim();

  if (!password || !passwordRegex.test(password)) {
    event.preventDefault();
    $("#error").text("Either the Username or Password is invalid!");
    $("#error").show();
    $("#password").focus();
    return;
  }
});
