var page = require('webpage').create();

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

page.open("test_webworker.html", function (status) {

  //Page is loaded!
  console.log("opened " + status);
  
  var wnd = page.evaluate(function () {
    return window;
  });

setTimeout(function() {
  console.dir(JSON.stringify(wnd.result));
  phantom.exit();
  
}, 5000);  

  
});


