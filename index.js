/*jshint white: true, laxbreak: true, laxcomma: true, debug: false, nomen: true, evil: false, quotmark: true, node:true*/
'use strict';
var data         = require('./data/resume.json')
    , http        = require('http')
    , express     = require('express')
    , swig        = require('swig')
    , path        = require('path')
    , isArray     = require('util').isArray
    , app         = express()
    , template    = swig.compileFile(path.join(__dirname, 'html', 'resume.html'))
    , nopt        = require('nopt')
    , knownOpts   = {
                        'port' : Number
                        , 'outputfile' : path
                    }
    , shortHands  = {
                        'p' : ['--port']
                        , 'f' : ['--outputfile']
                    }
             // everything is optional.
             // knownOpts and shorthands default to {}
             // arg list defaults to process.argv
             // slice defaults to 2
  , parsed = nopt(knownOpts, shortHands, process.argv, 2);

var id = 0;

function sort(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

function sortArrays(obj) {
    var type, val, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            val = obj[key];
            type = typeof val;
            if (isArray(val) && val.length > 0 && typeof val[0] === 'string') {
                val.sort(sort);
            } else if (type === 'object') {
                val.id = id;
                id += 1;
                sortArrays(val);
            }
        }
    }
    return obj;
}

data = sortArrays(data);

app.use('/css', express.static(path.join(__dirname, 'css')));

var output;

app.get('/', function (req, res) {
    if (!output) {
        output = template(data);
    }
    res.end(output);
});

function buildEmailDataUrl(email) {
    var Canvas = require('canvas')
      , canvas = new Canvas(300, 100)
      , ctx = canvas.getContext('2d');
    ctx.font = '14px Impact';

    var te = ctx.measureText(email)
      , height = te.actualBoundingBoxAscent + te.actualBoundingBoxDescent
      , canvas2 = new Canvas(te.width, height)
      , ctx2 = canvas2.getContext('2d');

    ctx2.font = '14px Impact';
    ctx2.fillText(email, 0, height - te.actualBoundingBoxDescent);
    var url = canvas2.toDataURL('image/png');
    canvas = canvas2 = ctx = ctx2 = te = undefined;
    return url;
}

data.email_src = buildEmailDataUrl(data.email);

if(parsed.outputfile) {
    output = template(data);
    require('fs').writeFile(parsed.outputfile, output);
} else {
    var server = http.createServer(app);
    server.listen(parsed.port || 4000);
}


