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
    $('.dropdown-menu').click(function(e) {
        e.stopPropagation();
    });
    $('.category').click(function() {
        var label = $(this).next().text().trim();
        if($(this).is(":checked")) {
            $(".problem[data-tags*='"+label+"']").show();
        } else {
            $(".problem[data-tags*='"+label+"']").hide();
        }
    });
    $("#uncheckall").click(function() {
        $(".problem").hide();
        $('.dropdown-menu input[type="checkbox"]').attr('checked', false);
    });
    $("#checkall").click(function() {
        $(".problem").show();
        $('.dropdown-menu input[type="checkbox"]').prop('checked', true);
    });
    $("#starred").click(function() {
        if($(this).is(":checked")) {
            $(".problem-star").show();
        } else {
            $(".problem-star").hide();
        }
    });
    $("#solved").click(function() {
        if($(this).is(":checked")) {
            $(".problem-solved").show();
        } else {
            $(".problem-solved").hide();
        }
    });
    $("#unsolved").click(function() {
        if($(this).is(":checked")) {
            $(".problem-unsolved").show();
        } else {
            $(".problem-unsolved").hide();
        }
    });
    $("#wronganswer").click(function() {
        if($(this).is(":checked")) {
            $(".problem-result-wa").show();
        } else {
            $(".problem-result-wa").hide();
        }
    });
    $("#tle").click(function() {
        if($(this).is(":checked")) {
            $(".problem-result-tle").show();
        } else {
            $(".problem-result-tle").hide();
        }
    });
    $("#rte").click(function() {
        if($(this).is(":checked")) {
            $(".problem-result-other").show();
        } else {
            $(".problem-result-other").hide();
        }
    });
    $(".problem").bind('contextmenu', function(e){
        e.preventDefault();
        var pname = $(this).text().trim();
        var handle = location.href.split('/');
        handle = handle[handle.length-1];
        if(handle[handle.length-1] == '#')
            handle = handle.substring(0, handle.length - 1);
        var problem = $(this);
        var exists = problem.find("i").length;
        $.ajax({
            url: "/starmark/"+handle+"/"+pname,
            success: function(){
                if(!exists){
                    var star = $("<i style='color:gold;margin-right:2px' class='glyphicon glyphicon-star'></i>");
                    problem.prepend(star);
                } else {
                    problem.find("i").remove();
                }
            }
        });
    });
});
