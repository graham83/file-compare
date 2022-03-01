var access_token = "de2be8a10003971ea7895b0cbed710ec";
var accountId = "BQttgd-test";

var express = require('express');
var formidable = require('formidable');
var fs = require('fs');

var client = require('@draftable/compare-api').client(accountId, access_token);

var comparisons = client.comparisons;

var app = express();

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html');
});

app.post('/', function (req, res){
    var form = new formidable.IncomingForm();

    var compareFiles = [];

    form.parse(req);

    form.on('fileBegin', function (name, file){
        //file.filepath = __dirname + '/uploads/' + file.originalFilename;
    });
    

    form.on('file', function (name, file){
        console.log('Uploaded ' + file.originalFilename);
        compareFiles.push(file);
    });

    form.once('end', () => {
        var file1 = compareFiles.pop();
        var file2 = compareFiles.pop();

        console.log("File 1 path: %s",file1.filepath);
        console.log("File 2 path: %s",file2.filepath);

        var oldpath = file1.filepath;
        var newpath1 = './' + file1.originalFilename;
        
        fs.renameSync(oldpath,newpath1);

        oldpath = file2.filepath;
        var newpath2 = './' + file2.originalFilename;

        fs.renameSync(oldpath,newpath2);
        comparisons.create({
            left: {
                source: fs.readFileSync(newpath1),
                fileType: 'docx',
            },
            right: {
                source: fs.readFileSync(newpath2),
                fileType: 'docx',
            },
        }).then(function(comparison) {
            console.log("Comparison created: %s", comparison);
            // Generate a signed viewer URL to access the private comparison. The expiry
            // time defaults to 30 minutes if the valid_until parameter is not provided.
            const viewerURL = comparisons.signedViewerURL(comparison.identifier);
            console.log("Viewer URL (expires in 30 mins): %s", viewerURL);

            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<h2>Comparison Successful</h2>');
            res.write('<a href="' + viewerURL + '">View Compare Result</a>');
            return res.end();
        });
        console.log('Done!');
      });
      

   // res.sendFile(__dirname + '/index.html');
});

app.listen(3000);