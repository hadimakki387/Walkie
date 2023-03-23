// This function is to creat slide animantion to the humburger menu on the mobile verision
$("button.mobile-menu-button").click(function () {
  $(".mobile-menu").toggleClass("slide");
  if ($(".mobile-menu").hasClass("slide")) {
    $(".mobile-menu").slideDown();
  } else {
    $(".mobile-menu").slideUp();
  }
});

// This function is to give style to the links in the navbar whenever they are clicked
$(".links").click(function () {
  $(".links")
    .not(this)
    .removeClass("text-emerald-500 border-b-4 border-emerald-500");
  $(this).addClass("text-emerald-500 border-b-4 border-emerald-500");
  if ($(this).hasClass("text-emerald-500 border-b-4 border-emerald-500")) {
    $(".links")
      .not(this)
      .removeClass("text-emerald-500 border-b-4 border-emerald-500");
  }
});

// This function is to hide the signIn buttons in the signIn page and unhide the signIn by email form
$(".email").click(() => {
  $(".signInButtons").addClass("hidden");
  $(".emailSignIn").removeClass("hidden");
  $(".newUser").addClass("hidden");
});

// This function is to unhide the signIn buttons in the signIn page and hide the signIn by email form
$(".backBtn").click(() => {
  $(".signInButtons").removeClass("hidden");
  $(".emailSignIn").addClass("hidden");
  $(".newUser").removeClass("hidden");
});

// This function is to creat slide animantion to the humburger menu on the mobile verision
$(".homeBurger").click(() => {
  $(".leftSilder").toggleClass("slideIn ");
  $(".bgChange").toggleClass("brightness-50 blur-sm");
  if ($(".leftSilder").hasClass("slideIn")) {
    $(".leftSilder").animate({ left: "0px" });
  } else {
    $(".leftSilder").animate({ left: "-384px" });
  }
});

//this function is for password validation
const passwordField = $(".password");
const passwordWarning = $(".password-warning");

function validatePassword() {
  const password = passwordField.val();
  const passwordRegex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

  if (password.length < 8 || !passwordRegex.test(password)) {
    passwordField.get(0).setCustomValidity("invalid");
    passwordWarning.text(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    );
  } else {
    passwordField.get(0).setCustomValidity("");
    passwordWarning.text("");
  }
}
passwordField.on("input", validatePassword);

//this function is for email validation
const emailField = $(".email");
const emailWarning = $(".email-warning");

function validateEmail() {
  const email = emailField.val();
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{3})+$/;

  if (!emailRegex.test(email)) {
    emailField.get(0).setCustomValidity("invalid");
    emailWarning.text("Please enter a valid email address.");
  } else {
    emailField.get(0).setCustomValidity("");
    emailWarning.text("");
  }
}
emailField.on("input", validateEmail);

//this function is for phone number validation
const phoneField = $(".phone");
const phoneWarning = $(".phone-warning");

function validatePhone() {
  const phone = phoneField.val();
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

  if (!phoneRegex.test(phone)) {
    phoneField.get(0).setCustomValidity("invalid");
    phoneWarning.text("Please enter a valid phone number.");
  } else {
    phoneField.get(0).setCustomValidity("");
    phoneWarning.text("");
  }
}
phoneField.on("input", validatePhone);

//this function is to unhide the subit button for adding a profile
$(".uploadProfile").on("click", () => {
  $(".submitProfile").removeClass("hidden");
});

$('.BTN').each(function(index, button) {
  $(button).click(() => {
    $(button).text('request sent');
    $(button).css({
      'background-color': 'white',
      'color': '#10b981'
    });
  });
});


function sendRequest(id) {
  fetch('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  }).then(() => {
    console.log('Clicked');
  }).catch(err => {
    console.error(err);
  });
}

console.log("style.js working")