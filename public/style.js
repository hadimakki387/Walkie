


// This function is to creat slide animantion to the humburger menu on the mobile verision
$("button.mobile-menu-button").click(function() {
  $(".mobile-menu").toggleClass("slide");
  if($('.mobile-menu').hasClass('slide')){
    $('.mobile-menu').slideDown()
  }else{
    $('.mobile-menu').slideUp()
  }
  
});


// This function is to give style to the links in the navbar whenever they are clicked
$(".links").click(function () {
    $(".links").not(this).removeClass("text-emerald-500 border-b-4 border-emerald-500");
    $(this).addClass("text-emerald-500 border-b-4 border-emerald-500");
    if ($(this).hasClass("text-emerald-500 border-b-4 border-emerald-500")) {
      $(".links").not(this).removeClass("text-emerald-500 border-b-4 border-emerald-500");
    }
  });


  // This function is to hide the signIn buttons in the signIn page and unhide the signIn by email form
  $('.email').click(()=>{
    $('.signInButtons').addClass('hidden')
    $('.emailSignIn').removeClass('hidden')
    $('.newUser').addClass('hidden')
    
  })


  // This function is to unhide the signIn buttons in the signIn page and hide the signIn by email form
  $('.backBtn').click(()=>{
    $('.signInButtons').removeClass('hidden')
    $('.emailSignIn').addClass('hidden')
    $('.newUser').removeClass('hidden')
  })


  // This function is to creat slide animantion to the humburger menu on the mobile verision
  $('.homeBurger').click(()=>{ 
    $('.leftSilder').toggleClass('slideIn '); 
    $('.bgChange').toggleClass('brightness-50 blur-sm') 
    if ($('.leftSilder').hasClass('slideIn')) { 
      $('.leftSilder').animate({ left: '0px' }); 
    } else { 
      $('.leftSilder').animate({ left: '-384px' }); 
    } })
  