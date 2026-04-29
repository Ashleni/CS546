$("#signup-form").submit((event) => {
  $("#error").hide();

  let nameRegex = /^[A-Za-z'-]{1,50}$/;
  let usernameRegex = /^[A-Za-z0-9_.]{3,30}$/;
  let passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;

  // first name
  let firstName = $("#firstName").val().trim();

  if (!firstName) {
    event.preventDefault();
    $("#error").text("First Name is missing!");
    $("#error").show();
    $("#firstName").focus();
    return;
  }

  if (!nameRegex.test(firstName)) {
    event.preventDefault();
    $("#error").text("First Name is invalid!");
    $("#error").show();
    $("#firstName").focus();
    return;
  }

  // last name
  let lastName = $("#lastName").val().trim();

  if (!lastName) {
    event.preventDefault();
    $("#error").text("Last Name is missing!");
    $("#error").show();
    $("#lastName").focus();
    return;
  }

  if (!nameRegex.test(lastName)) {
    event.preventDefault();
    $("#error").text("Last Name is invalid!");
    $("#error").show();
    $("#firstName").focus();
    return;
  }

  // username
  let username = $("#username").val().trim().toLowerCase();

  if (!username) {
    event.preventDefault();
    $("#error").text("Username is missing!");
    $("#error").show();
    $("#username").focus();
    return;
  }

  if (!nameRegex.test(username)) {
    event.preventDefault();
    $("#error").text("Username is invalid!");
    $("#error").show();
    $("#username").focus();
    return;
  }

  // password
  let password = $("#password").val().trim();

  if (!password) {
    event.preventDefault();
    $("#error").text("Password is missing!");
    $("#error").show();
    $("#password").focus();
    return;
  }

  if (!passwordRegex.test(password)) {
    event.preventDefault();
    $("#error").text("Password is invalid!");
    $("#error").show();
    $("#password").focus();
    return;
  }

  // confirm password
  let confirmPassword = $("#confirmPassword").val().trim();

  if (!confirmPassword) {
    event.preventDefault();
    $("#error").text("Confirm Password is missing!");
    $("#error").show();
    $("#confirmPassword").focus();
    return;
  }

  if (confirmPassword !== password) {
    event.preventDefault();
    $("#error").text("Passwords do not match!");
    $("#error").show();
    $("#confirmPassword").focus();
    return;
  }

  // role
  let role = $("#role").val().trim().toLowerCase();

  if (!role) {
    event.preventDefault();
    $("#error").text("Account Type is missing!");
    $("#error").show();
    $("#role").focus();
    return;
  }

  if (role !== "user" && role !== "admin") {
    event.preventDefault();
    $("#error").text(`Membership Level must be either 'Manager' or 'Member'!`);
    $("#error").show();
    $("#role").focus();
    return;
  }
});
