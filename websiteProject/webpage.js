
$(document).ready(function () {

    $(".thumbnail").hover(function () {

        $(this).animate({
            opacity:.78
        },150)

    }, function () {
        $(this).animate({
            opacity:1
        },150);
    });

});