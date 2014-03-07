(function(){
  if(window.squirting){
    window.squirted && document.dispatchEvent(new Event('squirt.again'));
    return;
  }
  window.squirting = null
  var s = document.createElement('script');
  s.src='//www.squirt.io/js';
  document.body.appendChild(s)
})();
