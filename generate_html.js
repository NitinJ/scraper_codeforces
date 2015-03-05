var fs = require('fs');
var request = require('request');

var PATH = "profiles/";
var HANDLE = process.argv[2];
if(HANDLE == undefined)
    HANDLE = "nitinj";
console.log(HANDLE);
var PROFILEDATAFILE = PATH+HANDLE+".json";
var CODEFORCES_JSON_DATA_FILE = "data/2codeforces_data_5.json";
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
var getTotalData = function (codeforcesDataJsonFilePath, callback){
    fs.readFile(codeforcesDataJsonFilePath, 'utf8', function (err, data) {
        if(err){
            throw err;
        } else {
            callback(JSON.parse(data));
        }
    });
}
var getTimeString = function (secs) {
    var seconds = secs;
    var h = parseInt(secs/3600);
    secs = secs%3600;
    var m = parseInt(secs/60);
    secs = secs%60;
    if(h < 10) h = '0'+h;
    if(m < 10) m = '0'+m;
    if(secs < 10) secs = '0'+secs;
    console.log(seconds, h+':'+m+':'+secs);
    return h+':'+m+':'+secs;
}
var writeStatsData = function (handle, profileData, data){
    data = data.output;
    profileData = profileData.result;
    console.log("Generating statistics for ", handle);
    var pdata = {};
    for(var i = 0;i<profileData.length;i++) {
        if(profileData[i].author.participantType == "CONTESTANT") {
            if(!pdata.hasOwnProperty(profileData[i].problem.name)){
                pdata[profileData[i].problem.name] = {
                    'attempts': 0,
                    'time': '02:00:01',
                    'status': 'WA',
                    'message': '',
                    'div': 1,
                    'code': 'A',
                    'ts': 7201
                }
            } 
            if(profileData[i].verdict == "OK") {
                pdata[profileData[i].problem.name].attempts++;
                pdata[profileData[i].problem.name].ts = Math.min(profileData[i].relativeTimeSeconds, pdata[profileData[i].problem.name].ts);
                pdata[profileData[i].problem.name].time = getTimeString(pdata[profileData[i].problem.name].ts);
                pdata[profileData[i].problem.name].status = "AC"; 
            } 
            if(pdata[profileData[i].problem.name].status != "AC") {
                pdata[profileData[i].problem.name].time = '02:00:01'; 
                pdata[profileData[i].problem.name].attempts++;
                try{
                    pdata[profileData[i].problem.name].status = {
                        "OK":"AC",
                        "WRONG_ANSWER":"WA",
                        "TIME_LIMIT_EXCEEDED":"TLE",
                        "RUNTIME_ERROR":"RTE",
                        "MEMORY_LIMIT_EXCEEDED":"MLE"
                    }[profileData[i].verdict];
                } catch(err) {
                    pdata[profileData[i].problem.name].status = "OTH";
                }
                if(pdata[profileData[i].problem.name].status == "undefined")
                    pdata[profileData[i].problem.name].status = "OTH";
            }
        }
    }
    for(var i = 0;i < data.length;i++) {
        var contest = data[i];
        for(var j = 0;j < contest['problems'].length;j++) {
            var pname = contest['problems'][j].name;
            var problem = contest['problems'][j];
            if(pdata.hasOwnProperty(pname)) {
                pdata[pname].div = contest.div;
                var code = problem.code;
                if(['A','B','C','D','E'].indexOf(code) < 0) {
                    code = 'O';
                }
                pdata[pname].code = code;
                problem.pdata = pdata[pname];
            }
        }
    }
    for(var i = 0;i < data.length;i++) {
        var contest = data[i];
        contest['problems'].sort(function(a,b) {
            if(!a.hasOwnProperty('pdata')) return true;
            if(!b.hasOwnProperty('pdata')) return true;
            return a.pdata.ts > b.pdata.ts;
        });
        if(i < 10)
            console.log(contest['problems']);

        for(var j = 0;j < contest['problems'].length;j++) {
            var pname = contest['problems'][j].name;
            var problem = contest['problems'][j];
            if(pdata.hasOwnProperty(pname)) {
                if(j != 0 && problem.pdata.ts != 7201){
                    var k = j-1;
                    while(k >= 0){
                        if(contest['problems'][k].hasOwnProperty('pdata')) {
                            problem.pdata.ts = problem.pdata.ts - contest['problems'][k].pdata.ts;
                            pdata[problem.name].ts = problem.pdata.ts;
                            pdata[problem.name].time = getTimeString(pdata[problem.name].ts);
                            break;
                        }
                        k--;
                    }
                }
            }
        }
    }
    for(pname in pdata) {
        var filename = "profiles/"+handle + '_' + pdata[pname].div + '_' + pdata[pname].code + '.csv';
        var dataStr = pdata[pname].time+","+pname+","+pdata[pname].attempts+","+pdata[pname].status+","+pdata[pname].message+"\n";
        fs.appendFile(filename, dataStr, function(error) {
            if(error) {
                throw error;
            }
        });
    }
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

    /*
    getTotalData(CODEFORCES_JSON_DATA_FILE, function(data) {
        writeStatsData(HANDLE, profileData, data);
    });
    */
});
