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
        var ts = Math.round(Date.now() / 1000);
        $("#ts").html("Contest data last updated : " + getTimeDiff(ts - parseInt($("#ts").html()))).removeClass("hide");
        $("#profile_ts").html("Profile data last updated : " + getTimeDiff(ts - parseInt($("#profile_ts").html()))).removeClass("hide");
    })
});
