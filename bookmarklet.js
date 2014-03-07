javascript:(function(){
  if(window.squirting){
    window.squirted && document.dispatchEvent(new Event('squirt.again'));
    return;
  }
  window.squirting = true;
  var s = document.createElement('script');
  s.src = '//www.squirt.io/squirt.js';
  document.body.appendChild(s);
})();
