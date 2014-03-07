---

## Speed read the web

Squirt is a bookmarklet: click and drag <a href="javascript:(function(){  if(window.squirting){    var test;    window.squirted && document.dispatchEvent(new Event('squirt.again'));  } else {    window.squirting = true;    var s = document.createElement('script');    s.src = window.location.search.indexOf('sq-dev') != -1 ? '/squirt.js'    : '//www.squirt.io/squirt.js';    document.body.appendChild(s);  }})();">Squirt</a> to your browser's bookmark bar.

Visit an [article](http://zenhabits.net/), click the bookmarklet, read speedily:

![In action](/squirt.gif)

*This GIF is a bit stuttery&mdash;actual performance is smoother.*

## On your phone

Trade two minutes of hassle for a [lifetime of efficiency](/mobile.html).

## Author

- Twitter: [@camron](http://twitter.com/camron)
- Github: [@cameron](http://github.com/cameron)
- Blog: [Siliconfidential](http://www.siliconfidential.com)
- Employed @ [Hack Reactor](http://www.hackreactor.com)

## Acknowledgements

[Spritz Inc](http://www.spritzinc.com/), the company whose patents are pending.

[Readability](https://www.readability.com/), the company who open-sourced their innovation and made mine sustainably possible.

[The problem with software patents](http://bit.ly/1fcEHQ3).
