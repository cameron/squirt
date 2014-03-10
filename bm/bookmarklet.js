(function(){
  console.log('clicked!');
  if(window.squirting){
    window.squirted && document.dispatchEvent(new Event('squirt.again'));
  } else {
    window.squirting = true;
    window.squirtUserId = '--squirtUser--';
    s = document.createElement('script');
    s.src = '//www.squirt.io/bm/squirt.js';
    s.search = window.location.search;
    s.idx = s.search.indexOf('sq-dev');
    if(s.idx != -1){
      s.ampIdx = s.search.indexOf('&');
      s.host = s.search.substring(s.idx + 7, s.ampIdx == -1 ? s.search.length : s.ampIdx);
      console.log(s.host);
      s.src = '//' + (s.host ? s.host : 'localhost') + ':4000/bm/squirt.js';
    }
    document.body.appendChild(s);
  }
})();
