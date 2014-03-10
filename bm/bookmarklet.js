(function(){
  if(window.sq){
    window.sq.closed && document.dispatchEvent(new Event('squirt.again'));
  } else {
    window.sq = {};
    window.sq.userId = '--squirtUser--';
    s = document.createElement('script');
    s.src = '//www.squirt.io/bm/squirt.js';
    s.search = window.location.search;
    s.idx = s.search.indexOf('sq-dev');
    if(s.idx != -1){
      s.ampIdx = s.search.indexOf('&');
      s.host = s.search.substring(s.idx + 7, s.ampIdx == -1 ? s.search.length : s.ampIdx);
      s.src = '//' + (s.host ? s.host : 'localhost') + ':4000/bm/squirt.js';
    }
    document.body.appendChild(s);
  }
})();
