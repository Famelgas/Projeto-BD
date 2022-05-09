$(document).ready(function() {
    /*$(".normalization-select").on("change", function(e){
      standard = $(this).val();

      if(current_diagram != 0){
        switch_view(current_diagram, true,true);
      }
    });

    // sounds for warning messages and stuff
    ion.sound({
      sounds: [
        {name: "Computer_Error"}
      ],
      // main config
      path: "sounds/",
      preload: true,
      multiplay: true,
      volume: 0.9
    });*/
    $(document).click(function() {
        if ($('.click-nav .js ul').is(':visible')) {
            $('.click-nav .js ul', this).slideUp();
            $('.clicker').removeClass('active');
        }
    });
});