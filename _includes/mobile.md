*Instructions are for iOS Chrome and Safari, but should be sufficient for the enterprising Android user.*

## Open this page on your phone
- Select and copy the JavaScript below to your clipboard:
<pre>javascript:(function(){  if(window.squirting){    window.squirted && document.dispatchEvent(new Event('squirt.again'));  } else {    window.squirting = true;    var s = document.createElement('script');    s.src = '//www.squirt.io/squirt.js';    if(window.location.search.indexOf('sq-dev') != -1){      s.src = '//localhost:4000/squirt.js';    }    document.body.appendChild(s);  }})();</pre>
- Bookmark the current page
- Open your bookmarks manager
  - **Chrome**: menu icon, right of the URL bar
  - **Safari**: book icon, bottom toolbar
- Edit the newly added bookmark
  - **Chrome**: top right (pencil icon)
  - **Safari**: bottom left ("Edit")
- Change the name to "Squirt"
- Clear the URL, paste the copied JavaScript, and save

## Bookmarklet installed

Let's run it!

- Visit [the page](http://zenhabits.net/) you want to read
- Run the bookmarklet
  - **Chrome**
    * Tap the URL bar
    * Type "Squirt"
    * Tap the "Squirt" bookmakrlet in the autocomplete list
  - **Safari**
    - Tap the URL bar
    - Tap the Squirt bookmarklet in the grid of icons

So read. Very speed. Wow.

## It's ugly on my Android!

I bet! Submit a [pull request](http://github.com/cameron/squirt), or wait for me to fix it :)
