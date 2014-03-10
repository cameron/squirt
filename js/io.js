(function(){
  (function io(injectKeen){
    injectKeen();
    Keen.addEvent('load');

    var userId = getCookie('squirtUserId', guid());
    var userBookmarklet = window.squirtBookmarklet.replace('--squirtUser--',
      userId);

    document.addEventListener('DOMContentLoaded', function injectBookmarklet(){
      (["a.bookmarklet","pre.bookmarklet", "h3.bookmarklet"]).map(function(query){
        var el = document.querySelector(query);
        if(!el) return;
        switch(query.replace('.bookmarklet','')){
          case 'a':
          el.setAttribute('href', userBookmarklet);
          break;

          case 'pre':
          el.textContent = userBookmarklet;
          break;

          case 'h3':
          el.setAttribute('onclick', userBookmarklet);
          break;
        }
      });
    });

    
    window.squirtText = "#SQ;wpm=200;SQ#Squirt displays one word at a time, positioning " +
      "them so that your eye can read them without moving.\n " +
      "Right now, you're reading at 200 words per minute. Let's go a little faster, " +
      "shall we?\n " +
      "#SQ;wpm=300;SQ#This is 300 words per minute. Average reading speed is between " +
      "120 and 200 " +
      "words per minute. " +
      "With Squirt, most people can read twice as fast without " +
      "training. Let's see how fast you can go!\n " +
      "#SQ;wpm=400;SQ#400 WPM!\n The buttons on the right let you control Squirt: " +
      "You can pause, rewind by 10 seconds, and set the rate at which words " +
      "are displayed.\n Close Squirt by tapping on the page " +
      "behind it. To install Squirt, follow the install link on the home page, " +
      "or wait for this sentence to finish...\n";

  })((function injectKeen(){
    window.Keen=window.Keen||{configure:function(e){this._cf=e},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i])},setGlobalProperties:function(e){this._gp=e},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e)}};(function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src=("https:"==document.location.protocol?"https://":"http://")+"dc8na2hxrj29i.cloudfront.net/code/keen-2.1.0-min.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})();

    var Keen = window.Keen;
    Keen.configure({
      projectId: "531aa8c136bf5a0f8e000003",
      writeKey: "a863509cd0ba1c7039d54e977520462be277d525f29e98798ae4742b963b22ede0234c467494a263bd6d6b064413c29cd984e90e6e6a4468d36fed1b04bcfce6f19f50853e37b45cb283b4d0dfc4c6e7a9a23148b1696d7ea2624f1c907abfac23a67bbbead623522552de3fedced628"
    });

    function addon(name, input, output){
      return { name: name, input: input, output: output};
    }

    Keen.setGlobalProperties(function(){
      var props = {
        source: "squirt.io",
        userId: window.squirtUserId || 'beta-user',
        href: window.location.href,
        rawUserAgent: "${keen.user_agent}",
        sessionId: 'sq-sesh-' + guid(),
        ip: "${keen.ip}",
        keen: { addons: [] },
        referrer: document.referrer,
        app_version: 'squirt.io'
      };
      var push = Array.prototype.push.bind(props.keen.addons);
      push(addon("keen:ip_to_geo", { ip: "ip" }, "geo"));
      push(addon("keen:ua_parser", { ua_string: "rawUserAgent" }, "userAgent"));
      return props;
    });

    return Keen;
  }));

  // utilities
  function guid(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  function getCookie(key, setIfUndefined){
    key = key + "=";

    var regexp = new RegExp(key + "[^;]*");
    var match = document.cookie.match(regexp);
    if(match && match.length){
      match = match[0].replace(key, '');
      if(match) return match;
    }

    var expires = new Date();
    expires.setDate(expires.getDate() + 365*20);
    var domain = window.location.hostname
                 .replace('www.','')
                 .replace('localhost', '');
    var cookie = key + setIfUndefined +
      ';path=/' +
      ';domain=' + domain +
      ';expires=' + expires.toUTCString();
    document.cookie = cookie;
    return setIfUndefined;
  };
})();