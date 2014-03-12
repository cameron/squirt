(function(){
  (function io(injectKeen){
    var userId = getCookie('squirtUserId', guid());
    injectKeen(userId);
    Keen.addEvent('load');

    var userBookmarklet = window.squirtBookmarklet.replace('--squirtUser--',
      userId);

    document.addEventListener('DOMContentLoaded', function injectBookmarklet(){
      (["a.bookmarklet","pre.bookmarklet", "h3.bookmarklet"]).map(function(query){
        var els = document.querySelectorAll(query);
        for(var el, elIdx = 0; elIdx < els.length; elIdx++){
          el = els[elIdx];
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
        }
      });
    });


    window.squirtText = "#SQ;wpm=250;SQ#Squirt displays one word after another " +
      "so that your eye can read without moving. " +
      "Let's go a little faster, " +
      "shall we? " +
      "#SQ;wpm=350;SQ#This is 350 words per minute. Average readers read between " +
      "120 and 200 words per minute. " +
      "Using Squirt, most people can read twice as fast without " +
      "training. Let's see how fast you can go!\n " +
      "#SQ;wpm=450;SQ#Now, you're doing 450 words per minute!\n " +
      "Squirt is a bookmarklet, which means you can use it on any website. " +
      "Ready to install? Here we go!";


  })((function injectKeen(userId){
    window.Keen=window.Keen||{configure:function(e){this._cf=e},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i])},setGlobalProperties:function(e){this._gp=e},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e)}};(function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src=("https:"==document.location.protocol?"https://":"http://")+"dc8na2hxrj29i.cloudfront.net/code/keen-2.1.0-min.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})();

    var Keen = window.Keen;
    var prod = {
      projectId: "531d7ffd36bf5a1ec4000000",
      writeKey: "9bdde746be9a9c7bca138171c98d6b7a4b4ce7f9c12dc62f0c3404ea8c7b5415a879151825b668a5682e0862374edaf46f7d6f25772f2fa6bc29aeef02310e8c376e89beffe7e3a4c5227a3aa7a40d8ce1dcde7cf28c7071b2b0e3c12f06b513c5f92fa5a9cfbc1bebaddaa7c595734d"
    };
    var dev = {
      projectId: "531aa8c136bf5a0f8e000003",
      writeKey: "a863509cd0ba1c7039d54e977520462be277d525f29e98798ae4742b963b22ede0234c467494a263bd6d6b064413c29cd984e90e6e6a4468d36fed1b04bcfce6f19f50853e37b45cb283b4d0dfc4c6e7a9a23148b1696d7ea2624f1c907abfac23a67bbbead623522552de3fedced628"
    };

    Keen.configure(window.location.hostname.match('squirt.io') ? prod : dev);

    function addon(name, input, output){
      return { name: name, input: input, output: output};
    }

    Keen.setGlobalProperties(function(){
      var props = {
        source: "squirt.io",
        userId: userId || 'beta-user',
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