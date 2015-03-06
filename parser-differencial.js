// Count all of the links from the Node.js build page
var jsdom = require("jsdom");
var fs = require('fs');
var request = require('request');
var colors = require('colors');
var jade = require('jade');

'use strict';
// Globals
var PAGES = [1,2,3,4,5];
var PATH = "";
var OUTPUT_FILE = PATH + "data/2codeforces_data_" + PAGES.length + ".json";
var JSONFILE = OUTPUT_FILE;
var DIFFERENCIAL_FILE = PATH + "data/2codeforces_data_"+ PAGES.length +"_lastcontest.json";

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
                    var nContests = 0;
                    var allContests2 = Array();
                    for(var i=0;i<allContests.length;i++){
                        var contest = getContestMetaData($, $(allContests[i]));
                        if(parseInt(contest['code']) > lastContest){
                            nContests++;
                            newLastContest = Math.max(newLastContest, parseInt(contest['code']));
                            allContests2.push(allContests[i]);
                        }
                    }
                    console.log( ("Page "+page+" contests = "+nContests).blue );
                    var sentContests = nContests;
                    totalContests += sentContests;
                    if(nContests == 0) {
                        console.log( ("Page "+page+" contests = "+ nContests).green );
                        callback(contests);
                    }
                    var i = 0;
                    var handleContestOutput = function(contest, data) {
                        contest['problems'] = data;
                        contests = contests.concat(contest);
                        nContests--;
                        if(!nContests) {
                            console.log( ("Page "+page+" contests = "+ sentContests).green );
                            callback(contests);
                        } else {
                            i++;
                            getContestProblems(getContestMetaData($, $(allContests2[i])), handleContestOutput);
                        }
                    };
                    getContestProblems(getContestMetaData($, $(allContests2[i])), handleContestOutput);
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
var writeToFile = function (fileName, newData) {
    fs.readFile(fileName, function(err,data){
        if(err){
            console.log(err);
            return;
        } else {
            data = JSON.parse(data);
            data.ts = newData.ts;
            for(var i=0;i<newData.output.length;i++){
                data.output.push(newData.output[i]);
            }
            fs.writeFile(fileName, JSON.stringify(data), function(err) {
                if(err) {
                    console.log(err.red);
                } else {
                    console.log("JSON written to", fileName);
                    console.log("Done!");
                }
            });
            fs.writeFile(DIFFERENCIAL_FILE, newLastContest, function(err){
                if(err) {
                    console.log(err.red);
                } else {
                    console.log("Updated new last contest to", DIFFERENCIAL_FILE);
                    console.log("Done!");
                }
            });
        }
    });
}

// Runner
var total = 1;
var output = [];
var lastContest = 0;
var newLastContest = 0;
fs.readFile(DIFFERENCIAL_FILE, function(error, data){
    if(error){
      console.log(error);
      return;
    }
    lastContest = parseInt(data);
    newLastContest = lastContest;
    console.log("Last known contest = ", lastContest);
    var i=0;
    (function(i) {
        getContestsOnPage(PAGES[i], function (data) {
            total--;
            output = output.concat(data);
            console.log("total = ", total);
            console.log( ("Got "+data.length+" contests from page "+(i+1)).yellow );
            if(!total) {
                console.log("Got data for all pages".green, output);
                writeToFile(OUTPUT_FILE, {ts:Math.floor(new Date()/1000), output:output});
            }
        });
    })(i);
});
