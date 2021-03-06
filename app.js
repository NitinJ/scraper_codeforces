var express = require('express')
var fs = require('fs')
var app = express();
var router = express.Router();
var child_process = require('child_process')
app.set('views', __dirname + '/templates');
app.use(express.static(__dirname + '/static'));

var CODEFORCES_JSON_DATA_FILE = __dirname + "/data/2codeforces_data_5.json";
var STATS_DIR = __dirname + "/profiles/";

var generateTemplateData = function (handle, profileData, starData, data) {
    var current_ts = Math.floor(new Date() / 1000);
    var total_ts = data.ts;
    var profile_ts = profileData.ts;
    data = data.output;
    profileData = profileData.result;
    successFullsubmissions = {};
    for(var i = 0;i<profileData.length;i++) {
        if(profileData[i].verdict == "OK") {
            successFullsubmissions[profileData[i].problem.name] |= 3;
        }
        else if(profileData[i].verdict == "WRONG_ANSWER"){
            successFullsubmissions[profileData[i].problem.name] |= 0;
        }
        else if(profileData[i].verdict == "TIME_LIMIT_EXCEEDED"){
            successFullsubmissions[profileData[i].problem.name] |= 1;
        }
    }
    var templateData = {
        ts: total_ts,
        profile_ts: profile_ts,
        user : handle,
        div1 : {},
        div2 : {},
        tags: {}
    }
    var divider = {div1: {}, div2: {}};
    for(var i = 0;i < data.length;i++) {
        var contest = data[i];
        var contestName = "";
        if(contest.round != "") {
            contestName = contest.round;
        } else {
            contestName = "c" + contest.code;
        }
        for(var j = 0;j < contest['problems'].length;j++) {
            if(successFullsubmissions.hasOwnProperty(contest['problems'][j].name) && successFullsubmissions[contest['problems'][j].name] == 3) {
                contest['problems'][j].solved = 3;
            }
            else if(successFullsubmissions.hasOwnProperty(contest['problems'][j].name) && successFullsubmissions[contest['problems'][j].name] == 0) {
                contest['problems'][j].solved = 0;
            }
            else if(successFullsubmissions.hasOwnProperty(contest['problems'][j].name) && successFullsubmissions[contest['problems'][j].name] == 1) {
                contest['problems'][j].solved = 1;
            }
            else{
                contest['problems'][j].solved = 2;
            }
            var problem = contest['problems'][j];
            // console.log(problem.tags);
            var problemName = contestName+"_"+problem.code;
            var code = problem.code;
            problem.star = starData.hasOwnProperty(problem.name);
            // console.log(problem.star);
            if(['A','B','C','D','E'].indexOf(code) < 0)
                code = 'O';
            if(contest.div == 2) {
                if(!templateData.div2.hasOwnProperty(code)) {
                    templateData.div2[code] = {solved:[], unsolved:[]};
                }
                if(!divider.div2.hasOwnProperty(code)) {
                    divider.div2[code] = 0;
                }
                if(parseInt(contest.round) < 257) {
                    divider.div2[code] = Math.max(divider.div2[code], parseInt(contest.round));
                }
                if(problem.solved == 3) {
                    for(t in problem.tags){
                        templateData.tags[problem.tags[t]] = 1;
                    }
                    templateData.div2[code].solved.push({
                        round: contest.round,
                        code: problemName,
                        name: problem.name,
                        link: problem.link,
                        status: problem.solved,
                        tags: problem.tags,
                        star: problem.star
                    });
                } else {
                    for(t in problem.tags){
                        templateData.tags[problem.tags[t]] = 1;
                    }
                    templateData.div2[code].unsolved.push({
                        round: contest.round,
                        code: problemName,
                        name: problem.name,
                        link: problem.link,
                        status: problem.solved,
                        tags: problem.tags,
                        star: problem.star
                    });
                }
            } else {
                if(!templateData.div1.hasOwnProperty(code)) {
                    templateData.div1[code] = {solved:[], unsolved:[]};
                }
                if(!divider.div1.hasOwnProperty(code)) {
                    divider.div1[code] = 0;
                }
                if(parseInt(contest.round) < 257) {
                    divider.div1[code] = Math.max(divider.div1[code], parseInt(contest.round));
                }
                if(problem.solved == 3) {
                    for(t in problem.tags){
                        templateData.tags[problem.tags[t]] = 1;
                    }
                    templateData.div1[code].solved.push({
                        round: contest.round,
                        code: problemName,
                        name: problem.name,
                        link: problem.link,
                        status: problem.solved,
                        tags: problem.tags,
                        star: problem.star
                    });
                } else {
                    for(t in problem.tags){
                        templateData.tags[problem.tags[t]] = 1;
                    }
                    templateData.div1[code].unsolved.push({
                        round: contest.round,
                        code: problemName,
                        name: problem.name,
                        link: problem.link,
                        status: problem.solved,
                        tags: problem.tags,
                        star: problem.star
                    });
                }
            }
        }
    }
    for(p in templateData.div2){
        templateData.div2[p].unsolved.push({
            round: divider.div2[p],
            code: "PRACTICE",
            name: "PROBLEM DIVIDER",
            link: "http://www.codeforces.com"
        });
        templateData.div2[p].unsolved.sort(function(a,b){
            return -parseInt(a.round) + parseInt(b.round);
        });
        templateData.div2[p].solved.sort(function(a,b){
            return -parseInt(a.round) + parseInt(b.round);
        });
    }
    for(p in templateData.div1){
        templateData.div1[p].unsolved.push({
            round: divider.div1[p],
            code: "PRACTICE",
            name: "PROBLEM DIVIDER",
            link: "http://www.codeforces.com",
            tags: []
        });
        templateData.div1[p].unsolved.sort(function(a,b){
            return -parseInt(a.round) + parseInt(b.round);
        });
        templateData.div1[p].solved.sort(function(a,b){
            return -parseInt(a.round) + parseInt(b.round);
        });
    }
    // console.log("data = ", templateData.tags);
    return templateData;
}
var getTotalData = function (codeforcesDataJsonFilePath, handle, profileData, starData, callback){
    fs.readFile(codeforcesDataJsonFilePath, 'utf8', function (err, data) {
        if(err){
            throw err;
        } else {
            callback(generateTemplateData(handle, profileData, starData, JSON.parse(data)));
        }
    });
}

app.get('/updatecontestdata', function (req, res) {
    var handle = req.query.handle;
    console.log('nodejs parser-differencial.js');
    var child = child_process.exec('nodejs parser-differencial.js', function(a,b,c){
    });
    res.redirect("/");
});

app.get('/refreshstats/:id', function (req, res) {
    var referer = req.headers['referer'];
    console.log('nodejs generate_html.js '+req.params.id);
    var child = child_process.exec('nodejs generate_html.js '+req.params.id, function(a,b,c){
        res.redirect(referer);
    });
});

app.get('/addhandle', function (req, res) {
    var handle = req.query.handle;
    console.log('nodejs generate_html.js '+handle);
    var child = child_process.exec('nodejs generate_html.js '+handle, function(a,b,c){
        res.redirect("/");
    });
});

app.get('/removehandle/:handle', function (req, res) {
    var handle = req.params.handle;
    fs.unlink("profiles/"+handle+".json");
    res.redirect("/");
});

app.get('/starmark/:handle/:pname', function (req, res) {
    var handle = req.params.handle;
    var pname = req.params.pname;
    console.log(handle);
    console.log(pname);
    if (!fs.existsSync(__dirname + "/profiles/"+handle+"_star.star")) {
        fs.writeFileSync(__dirname + "/profiles/"+handle+"_star.star", JSON.stringify({}));
    }
    fs.readFile(__dirname + "/profiles/"+handle+"_star.star", 'utf8', function (err, data) {
        var stardata = JSON.parse(data);
        if(err) {
        } else {
            if(stardata.hasOwnProperty(pname)) {
                delete stardata[pname];
            } else {
                stardata[pname] = 1;
            }
            fs.writeFile(__dirname + "/profiles/"+handle+"_star.star", JSON.stringify(stardata), function(err) {});
        }
    });
    res.json({'status':1});
});

app.get('/profiles/:id', function (req, res) {
    console.log("handle requested = ", req.params.id);
    var handle = req.params.id;
    if (!fs.existsSync(__dirname + "/profiles/"+handle+"_star.star")) {
        fs.writeFileSync(__dirname + "/profiles/"+handle+"_star.star", JSON.stringify({}));
    }
    var starData = JSON.parse(fs.readFileSync(__dirname + '/profiles/' + handle + "_star.star", 'utf8'));
    fs.readFile(__dirname + '/profiles/' + handle + ".json", 'utf8', function (err, data) {
        var profileData = JSON.parse(data);
        if(err) {
            res.render('template.jade', {});
        } else {
            getTotalData(CODEFORCES_JSON_DATA_FILE, handle, profileData, starData, function (data) {
                data['handle'] = handle;
                res.render('template.jade', data);
            });
        }
    });
});

app.get('/', function (req, res) {
    fs.readdir(__dirname + '/profiles', function (err, files) {
        var profiles = [];
        for (var i = files.length - 1; i >= 0; i--) {
            var f = files[i].lastIndexOf('.json');
            if(f > 0 && f+5 == files[i].length)
                profiles.push(files[i].replace(/.json/g, ''));
        };
        res.render('index.jade', {profiles: profiles});
    });
});

var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
});


// nitin.json
// 0123456789