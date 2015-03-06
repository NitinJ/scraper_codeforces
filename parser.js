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
var OUTPUT_FILE = PATH + "data/Z_2codeforces_data_" + PAGES.length + ".json";
var JSONFILE = OUTPUT_FILE;

var getTextNodesIn = function ($, el) {
    return $(el).find(":not(iframe)").addBack().contents().filter(function () {
        return this.nodeType === 3;
    });
};
var totalContests = 0;
var totalContestsRecieved = 0;
var getContestProblems = function (contest, callback) {
    var contestUrl = contest['link'];
    var contestProblems = [];
    if(getContestProblems.retries.hasOwnProperty(contestUrl)) {
        getContestProblems.retries[contestUrl]++;
    } else {
        getContestProblems.retries[contestUrl] = 0;
    }
    var contestId = contestUrl.split("/");
    contestId = contestId[contestId.length-1];
    request('http://codeforces.com/api/contest.standings?contestId='+contestId+'&from=1&count=1', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var problems = JSON.parse(response.body).result.problems;
            for(var i = 0;i < problems.length;i++) {
                var problem = {};
                problem['code'] = problems[i].index;
                problem['link'] = contestUrl+"/problem/"+problems[i].index;
                problem['name'] = problems[i].name;
                problem['tags'] = problems[i].tags;
                problem['solved'] = false;
                contestProblems.push(problem);
            }
            totalContestsRecieved++;
            console.log((totalContestsRecieved+"/"+totalContests+" "+contestUrl).green);
            callback(contest, contestProblems);
        } else {
            console.log(contestUrl.red, error, response.statusCode, body);
            if(getContestProblems.retries[contestUrl] > getContestProblems.maxRetries) {
                console.log("Max retries exceeded".red);
                callback(contest, contestProblems);
            } else {
                console.log("Retrying...");
                setTimeout(function(){
                    getContestProblems(contest, callback);
                }, 200);
            }
        }
    });
}
getContestProblems.retries = {};
getContestProblems.maxRetries = 1000;
var getContestMetaData = function ($, node) {
    var contest = {};
    contest['name'] = getTextNodesIn($, node)[0].textContent.trim();
    contest['round'] = '';
    for(var j=contest['name'].indexOf('#')+1;j<contest['name'].length && contest['name'][j]!=' ';j++)
        contest['round'] = contest['round'] + contest['name'][j];
    contest['div'] = (contest['name'].indexOf('Div. 2') >= 0)?(2):(1);
    contest['link'] = "http://www.codeforces.com" + node.find("a").attr('href');
    contest['code'] = node.find("a").attr('href').split("/")[2];
    contest['problems'] = [];
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
                    var i = 0;
                    var handleContestOutput = function(contest, data) {
                        contest['problems'] = data;
                        contests = contests.concat(contest);
                        nContests--;
                        if(!nContests) {
                            console.log( ("Page "+page+" contests = "+ allContests.length).green );
                            callback(contests);
                        } else {
                            i++;
                            getContestProblems(getContestMetaData($, $(allContests[i])), handleContestOutput);
                        }
                    };
                    getContestProblems(getContestMetaData($, $(allContests[i])), handleContestOutput);

                })(window.$);
            }
            else{
                console.log("Error Page".red, page);
                if(getContestsOnPage.retries[page] > getContestsOnPage.maxRetries) {
                    console.log("Max retries exceeded".red);
                    callback(contests);
                } else {
                    console.log("Retrying...");
                    setTimeout(function(){
                        getContestsOnPage(page, callback);
                    }, 200);
                }
            }
        }
    );
}
getContestsOnPage.retries = {};
getContestsOnPage.maxRetries = 100;
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
var i = 0;
var handlePageOutput = function (data) {
    total--;
    output = output.concat(data);
    console.log( ("Got "+data.length+" contests from page "+(i+1)).yellow );
    if(!total) {
        console.log("Got data for all pages");
        writeToFile(OUTPUT_FILE, {ts:Math.floor(new Date()/1000), output:output});
    } else {
        getContestsOnPage(PAGES[++i], handlePageOutput);
    }
}
getContestsOnPage(PAGES[i], handlePageOutput);