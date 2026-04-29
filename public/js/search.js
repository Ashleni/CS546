$("#search-form").submit((event) => {
  $("#error").hide();

  let name = $("#name").val().trim();
  let boro = $("#boro").val().trim().toLowerCase();
  let cuisine = $("#cuisine").val().trim().toLowerCase();

  if (!name && boro === "select" && !cuisine) {
    event.preventDefault();
    $("#error").text("At least one search term must be given!");
    $("#error").show();
    $("#username").focus();
    return;
  }

  // check boro is valid
  if (boro === "select") boro = "";
  const validBoros = [
    "manhattan",
    "bronx",
    "brooklyn",
    "queens",
    "staten island",
  ];

  if (!validBoros.includes(boro) && boro !== "") {
    event.preventDefault();
    $("#error").text("Invalid borough!");
    $("#error").show();
    $("#username").focus();
    return;
  }
});
