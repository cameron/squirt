---
Squirt is a bookmarklet: click and drag <a href="javascript:(function(){  if(window.squirting){    window.squirted && document.dispatchEvent(new Event('squirt.again'));  } else {    window.squirting = true;    var s = document.createElement('script');    s.src = '//www.squirt.io/squirt.js';    if(window.location.search.indexOf('sq-dev') != -1){      s.src = '//localhost:4000/squirt.js';    }    document.body.appendChild(s);  }})();">Squirt</a> to your browser's bookmark bar. ([Instructions for mobile.](/mobile.html))

Visit an [article](http://zenhabits.net/), click the bookmarklet, read speedily:

![In action](/squirt.gif)

You can also try selecting text before clicking the bookmarklet to speed read part of a page.

## On your phone

Trade one minute of hassle for a [lifetime of efficiency](/mobile.html).

## Author

- Twitter: [@camron](http://twitter.com/camron)
- Github: [@cameron](http://github.com/cameron)
- Blog: [Siliconfidential](http://www.siliconfidential.com)
- Employed @ [Hack Reactor](http://www.hackreactor.com)

## Acknowledgements

[Spritz Inc](http://www.spritzinc.com/), the company whose patents are pending.

[Readability](https://www.readability.com/), the company who open-sourced their innovation and made mine sustainably possible.

[The problem with software patents](http://bit.ly/1fcEHQ3).
