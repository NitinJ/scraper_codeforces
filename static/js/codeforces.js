var getTimeDiff = function (seconds){
    var strs = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
    var s = 6;
    var secs = [1, 1*60, 1*60*60, 1*60*60*24, 1*60*60*24*7, 1*60*60*24*7*4, 1*60*60*24*7*4*12];
    var out = 0;
    while(s >= 0) {
        if(seconds >= secs[s]) {
            out = Math.round(seconds/secs[s]);
            break;
        } else {
            s--;
        }
    }
    return out + " " + strs[s] + " ago";
}
$(document).ready(function(){
    $(function () {
        var ts_initial = parseInt($("#ts").html());
        var profile_ts_initial = parseInt($("#profile_ts").html());
        $("#ts").html("Contest data last updated : " + getTimeDiff(Math.round(Date.now() / 1000) - ts_initial)).removeClass("hide");
        $("#profile_ts").html("Profile data last updated : " + getTimeDiff(Math.round(Date.now() / 1000) - profile_ts_initial)).removeClass("hide");
        var invFunction = function(){
            var ts = Math.round(Date.now() / 1000);
            $("#ts").html("Contest data last updated : " + getTimeDiff(ts - ts_initial)).removeClass("hide");
            $("#profile_ts").html("Profile data last updated : " + getTimeDiff(ts - profile_ts_initial)).removeClass("hide");
        }
        var intervalVar = setInterval(invFunction, 60*1000);
    });
    $(function () {
      $('[data-toggle="popover"]').popover();
    });
});
