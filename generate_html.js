var fs = require('fs');
var request = require('request');

var PATH = "profiles/";
var HANDLE = process.argv[2];
if(HANDLE == undefined)
    HANDLE = "nitinj";
console.log(HANDLE);
var PROFILEDATAFILE = PATH+HANDLE+".json";
var PROFILEDATASTATSFILE = PATH+HANDLE+"_stats.json";

var getProfileData = function (handle, callback){
    console.log("Getting profile data for " + HANDLE);
    request('http://codeforces.com/api/user.status?handle='+handle+'&from=1&count=100000', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Got profile data for " + HANDLE);
            callback({ts:Math.floor(new Date() / 1000), result:JSON.parse(response.body).result});
        }
    });
}

// Runner
getProfileData(HANDLE, function(profileData){
    fs.writeFile(PROFILEDATAFILE, JSON.stringify(profileData), function (error) {
        if(error) {
            throw error;
        } else {
            console.log("Profile data successfully written to", PROFILEDATAFILE);
        }
    });
});
