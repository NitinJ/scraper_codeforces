// Count all of the links from the Node.js build page
var jsdom = require("jsdom");
var fs = require('fs');
var request = require('request');
var colors = require('colors');
var jade = require('jade');

'use strict';
// Globals
var PAGES = [1, 2, 3, 4, 5];
var PATH = "";
var OUTPUT_FILE = PATH + "data/2codeforces_data_" + PAGES.length + ".json";
var JSONFILE = OUTPUT_FILE;

var getTextNodesIn = function ($, el) {
    return $(el).find(":not(iframe)").addBack().contents().filter(function () {
        return this.nodeType === 3;
    });
};
var totalContests = 0;
var totalContestsRecieved = 0;
var getContestProblems = function (contestUrl, callback) {
    var contestProblems = [];
    if(getContestProblems.retries.hasOwnProperty(contestUrl)) {
        getContestProblems.retries[contestUrl]++;
    } else {
        getContestProblems.retries[contestUrl] = 0;
    }
    setTimeout(function(){
        jsdom.env(
                contestUrl,
                ["http://code.jquery.com/jquery.js"],
                function(errors, window) {
                    if(!errors){
                        (function($){
                            var problems = $(".problems tr:not(:first)");
                            var p = 0;
                            $.each(problems, function() {
                                p++;
                                var problem = {};
                                problem['code'] = $(this).find("td a:first()");
                                problem['link'] = "http://www.codeforces.com" + problem['code'].attr('href');
                                problem['code'] = problem['code'].text().trim();
                                problem['name'] = $(this).find("td a:nth(1)").text();
                                problem['solved'] = false;
                                // console.log(problem);
                                contestProblems.push(problem);
                                if(p == problems.length) {
                                    totalContestsRecieved++;
                                    console.log((totalContestsRecieved+"/"+totalContests+" "+contestUrl).green);
                                    callback(contestProblems);
                                }
                            });
                        })(window.$);
                    }
                    else{
                        console.log(contestUrl.red, errors);
                        if(getContestProblems.retries[contestUrl] > getContestProblems.maxRetries) {
                            console.log("Max retries exceeded".red);
                            callback(contestProblems);
                        } else {
                            console.log("Retrying...");
                            getContestProblems(contestUrl, callback);
                        }
                    }
                }
            );
    }, 1000);

}
getContestProblems.retries = {};
getContestProblems.maxRetries = 3;
var getContestMetaData = function ($, node) {
    var contest = {};
    contest['name'] = getTextNodesIn($, node)[0].textContent.trim();
    contest['round'] = '';
    for(var j=contest['name'].indexOf('#')+1;j<contest['name'].length && contest['name'][j]!=' ';j++) {
        contest['round'] = contest['round'] + contest['name'][j];
    }
    contest['div'] = (contest['name'].indexOf('Div. 2') >= 0)?(2):(1);
    contest['link'] = "http://www.codeforces.com" + node.find("a").attr('href');
    contest['code'] = node.find("a").attr('href').split("/")[2];
    contest['problems'] = [];
    // console.log(contest);
    return contest;
}
var getContestsOnPage = function (page, callback) {
    var url = "http://www.codeforces.com/contests/page/"+page;
    var contests = [];
    if(getContestsOnPage.retries.hasOwnProperty(page)) {
        getContestsOnPage.retries[page]++;
    } else {
        getContestsOnPage.retries[page] = 0;
    }
    setTimeout(function(){
        jsdom.env(
            url,
            ["http://code.jquery.com/jquery.js"],
            function (errors, window) {
                if(!errors){
                    (function($) {
                        var allContests = $(".datatable table:last() tbody tr").find("td:first()");
                        var nContests = allContests.length;
                        totalContests += nContests;
                        console.log( ("Page "+page+" contests = "+nContests).blue );
                        $.each(allContests, function() {
                            var contest = getContestMetaData($, $(this));
                            getContestProblems(contest['link'], function(data) {
                                contest['problems'] = data;
                                contests = contests.concat(contest);
                                // console.log(contests);
                                nContests--;
                                if(!nContests) {
                                    console.log( ("Page "+page+" contests = "+ allContests.length).green );
                                    callback(contests);
                                }
                            });
                        });
                    })(window.$);
                }
                else{
                    console.log("Error Page".red, page);
                    if(getContestsOnPage.retries[page] > getContestsOnPage.maxRetries) {
                        console.log("Max retries exceeded".red);
                        callback(contests);
                    } else {
                        console.log("Retrying...");
                        getContestsOnPage(page, callback);
                    }
                }
            }
        )
    }, 1000);
}
getContestsOnPage.retries = {};
getContestsOnPage.maxRetries = 2;
var writeToFile = function (fileName, data) {
    fs.writeFile(fileName, JSON.stringify(data), function(err) {
        if(err) {
            console.log(err.red);
        } else {
            console.log("JSON written to", fileName);
            console.log("Done!");
        }
    });
}

// Runner
var total = PAGES.length;
var output = [];
for(var i=0;i<PAGES.length;i++) {
    (function(i) {
        setTimeout(function(){
            getContestsOnPage(PAGES[i], function (data) {
                total--;
                output = output.concat(data);
                console.log( ("Got "+data.length+" contests from page "+(i+1)).yellow );
                if(!total) {
                    console.log("Got data for all pages");
                    writeToFile(OUTPUT_FILE, {ts:Math.floor(new Date()/1000), output:output});
                }
            });
        },2*60*1000);
    })(i);
}