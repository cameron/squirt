(function(){
  if(window.squirting){
    window.squirted && document.dispatchEvent(new Event('squirt.again'));
  } else {
    window.squirting = true;
    s = document.createElement('script');
    s.src = '//www.squirt.io/squirt.js';
    if(window.location.search.indexOf('sq-dev') != -1){
      s.src = '//localhost:4000/squirt.js';
    }
    document.body.appendChild(s);
  }
})();
