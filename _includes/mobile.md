*Instructions are for iOS Chrome and Safari, but should be sufficient for the enterprising Android user.*

## Open this page on your phone
- Copy the JavaScript below to your clipboard
<pre>javascript:(function(){  if(window.squirting){    var test;    window.squirted && document.dispatchEvent(new Event('squirt.again'));  } else {    window.squirting = true;    var s = document.createElement('script');    s.src = window.location.search.indexOf('sq-dev') != -1 ? '/squirt.js'    : '//www.squirt.io/squirt.js';    document.body.appendChild(s);  }})();</pre>
- Bookmark the current page
- Open your bookmarks manager
  - **Chrome**: menu icon, right of the URL bar
  - **Safari**: book icon, bottom toolbar
- Find the newly added bookmark, and tap edit
  - **Chrome**: top right (pencil icon)
  - **Safari**: bottom left ("Edit")
- Change the name to "Squirt"
- Clear the URL, paste the copied JavaScript, and save

## Bookmarklet installed

Let's run it!

- Visit the page you want to speed read
  - **Chrome**
    * Tap the URL bar
    * Type "Squirt"
    * Tap the "Squirt" bookmakrlet in the autocomplete list
  - **Safari**
    - Tap the URL bar
    - Tap the Squirt bookmarklet in the grid of icons

So read. Very speed. Wow.
