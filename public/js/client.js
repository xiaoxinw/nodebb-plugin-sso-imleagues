/**
 * Created by junzhe on 2014/10/13.
 */
$(window).on("action:ajaxify.end", function(e, t) {
    if (t.url.indexOf("login")>=0 || t.url.indexOf("register")>=0 ) {
        var a= $("ul.alt-logins li.imleagues a");
        a.html('<image src="http://www.imleagues.com/images/imleagues-logo-hover.png"> Login via IMLeagues');
	a.addClass("btn btn-primary");
    }
});
