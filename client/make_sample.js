var path = require('path');
var fs = require('fs');
var filePath = path.join(__dirname, '/data/') + 'SENSOR-temp' ;

setInterval(function() {
  fs.writeFile(filePath, parseInt((Math.random() * 100)), function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
  }); 
}, 5000);