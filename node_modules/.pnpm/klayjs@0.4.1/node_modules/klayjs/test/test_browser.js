var page = require('webpage').create();

page.open("test_browser.html", function (status) {
  //Page is loaded!
  console.log("opened " + status);
  
  var wnd = page.evaluate(function () {
    return window;
  });
  
  console.dir(JSON.stringify(wnd.result));

  phantom.exit();
  
});