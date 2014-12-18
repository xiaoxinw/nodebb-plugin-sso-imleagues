/**
 * Created by junzhe on 2014/10/13.
 */
$(window).on("action:ajaxify.end", function(e, t) {
    if (t.url.indexOf("login")>=0 || t.url.indexOf("register")>=0 ) {
        var i = $("ul.alt-logins li.imleagues");
        i.css("display", "none");
        $('<a href="' + RELATIVE_PATH + '/auth/imleagues" class="btn btn-default"><i class="fa fa-external-link"></i> Login via IMLeagues</a>').insertAfter(i)
    }
});
