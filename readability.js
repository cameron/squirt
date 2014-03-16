// Forked/hacked for Squirt: github.com/cameron/squirt

/* Original Source:  http://code.google.com/p/arc90labs-readability
 * Copyright (c) 2010 Arc90 Inc
 * Readability is licensed under the Apache License, Version 2.0.
 **/

var dbg = function() {};

var readability = {
  version:                '1.7.1',
  flags:                   0x1 | 0x2 | 0x4,   /* Start with all flags set. */

  /* constants */
  FLAG_STRIP_UNLIKELYS:     0x1,
  FLAG_WEIGHT_CLASSES:      0x2,
  FLAG_CLEAN_CONDITIONALLY: 0x4,

  maxPages:    30, // max pages before showing link
  parsedPages: {},
  pageETags:   {},

  regexps: {
    unlikelyCandidates:    /ad|aside|combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter|figure|figcaption/i,
    okMaybeItsACandidate:  /and|article|body|column|main|shadow/i,
    positive:              /article|body|content|entry|hentry|main|page|pagination|post|text|blog|story/i,
    negative:              /combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/i,
    extraneous:            /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single/i,
    divToPElements:        /<(a|blockquote|dl|div|img|ol|p|pre|table|ul)/i,
    replaceBrs:            /(<br[^>]*>[ \n\r\t]*){2,}/gi,
    replaceFonts:          /<(\/?)font[^>]*>/gi,
    trim:                  /^\s+|\s+$/g,
    normalize:             /\s{2,}/g,
    killBreaks:            /(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,
    videos:                /http:\/\/(www\.)?(youtube|vimeo)\.com/i,
    skipFootnoteLink:      /^\s*(\[?[a-z0-9]{1,2}\]?|^|edit|citation needed)\s*$/i,
    nextLink:              /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i, // Match: next, continue, >, >>, » but not >|, »| as those usually mean last.
    prevLink:              /(prev|earl|old|new|<|«)/i
  },

  // Get the article title as an H1.
  getArticleTitle: function () {
    var curTitle = "",
        origTitle = "";

    try {
      curTitle = origTitle = document.title;

      if(typeof curTitle !== "string") { /* If they had an element with id "title" in their HTML */
        curTitle = origTitle = document.getElementsByTagName('title')[0].textContent;
      }
    }
    catch(e) {}

    if(curTitle.match(/ [\|\-] /))
    {
      curTitle = origTitle.replace(/(.*)[\|\-] .*/gi,'$1');

      if(curTitle.split(' ').length < 3) {
        curTitle = origTitle.replace(/[^\|\-]*[\|\-](.*)/gi,'$1');
      }
    }
    else if(curTitle.indexOf(': ') !== -1)
    {
      curTitle = origTitle.replace(/.*:(.*)/gi, '$1');

      if(curTitle.split(' ').length < 3) {
        curTitle = origTitle.replace(/[^:]*[:](.*)/gi,'$1');
      }
    }
    else if(curTitle.length > 150 || curTitle.length < 15)
    {
      var hOnes = document.getElementsByTagName('h1');
      if(hOnes.length === 1)
      {
        curTitle = hOnes[0].textContent;
      }
    }

    curTitle = curTitle.replace( readability.regexps.trim, "" );

    if(curTitle.split(' ').length <= 4) {
      curTitle = origTitle;
    }

    var articleTitle = document.createElement("H1");
    articleTitle.innerHTML = curTitle;

    return articleTitle;
  },

  prepArticle: function (articleContent) {
    readability.killBreaks(articleContent);

    /* Clean out junk from the article content */
    readability.cleanConditionally(articleContent, "form");
    readability.clean(articleContent, "object");
    readability.clean(articleContent, "h1");

    /**
     * If there is only one h2, they are probably using it
     * as a header and not a subheader, so remove it since we already have a header.
     ***/
    if(articleContent.getElementsByTagName('h2').length === 1) {
      readability.clean(articleContent, "h2");
    }
    readability.clean(articleContent, "iframe");

    readability.cleanHeaders(articleContent);

    /* Do these last as the previous stuff may have removed junk that will affect these */
    readability.cleanConditionally(articleContent, "table");
    readability.cleanConditionally(articleContent, "ul");
    readability.cleanConditionally(articleContent, "div");

    /* Remove extra paragraphs */
    var articleParagraphs = articleContent.getElementsByTagName('p');
    for(var i = articleParagraphs.length-1; i >= 0; i-=1) {
      var imgCount    = articleParagraphs[i].getElementsByTagName('img').length;
      var embedCount  = articleParagraphs[i].getElementsByTagName('embed').length;
      var objectCount = articleParagraphs[i].getElementsByTagName('object').length;

      if(imgCount === 0 && embedCount === 0 && objectCount === 0 && articleParagraphs[i].textContent === '') {
        articleParagraphs[i].parentNode.removeChild(articleParagraphs[i]);
      }
    }

    try {
      articleContent.innerHTML = articleContent.innerHTML.replace(/<br[^>]*>\s*<p/gi, '<p');
    }
    catch (e) {
      dbg("Cleaning innerHTML of breaks failed. This is an IE strict-block-elements bug. Ignoring.: " + e);
    }
  },

  /**
   * Initialize a node with the readability object. Also checks the
   * className/id for special names to add to its score.
   *
   * @param Element
   * @return void
   **/
  initializeNode: function (node) {
    node.readability = {"contentScore": 0};

    switch(node.tagName) {
      case 'DIV':
      node.readability.contentScore += 5;
      break;

      case 'PRE':
      case 'TD':
      case 'BLOCKQUOTE':
      node.readability.contentScore += 3;
      break;

      case 'ADDRESS':
      case 'OL':
      case 'UL':
      case 'DL':
      case 'DD':
      case 'DT':
      case 'LI':
      case 'FORM':
      node.readability.contentScore -= 3;
      break;

      case 'H1':
      case 'H2':
      case 'H3':
      case 'H4':
      case 'H5':
      case 'H6':
      case 'TH':
      node.readability.contentScore -= 5;
      break;
    }

    node.readability.contentScore += readability.getClassWeight(node);
  },

  /**
   * grabArticle - Using a variety of metrics (content score, classname,
   * element types), find the content that is most likely to be the stuff
   * a user wants to read. Then return it wrapped up in a div.
   *
   * @param page a document to run upon. Needs to be a full document, complete
   * with body.
   *
   * @return Element
   **/
  grabArticle: function () {
    var stripUnlikelyCandidates = readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS),
        isPaging = (page !== null) ? true: false;

    var page = document.body.cloneNode(true);

    var pageCacheHtml = page.innerHTML;

    var allElements = page.getElementsByTagName('*');

    /**
     * First, node prepping. Trash nodes that look cruddy (like ones with the
     * class name "comment", etc), and turn divs into P tags where they have
     * been used inappropriately (as in, where they contain no other block
     * level elements.)
     *
     * Note: Assignment from index for performance. See
     * http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5
     * TODO: Shouldn't this be a reverse traversal?
     **/
    var node = null;
    var nodesToScore = [];
    var nodeIndex;
    var remove = function(node){
      node.remove();
      nodeIndex--;
    }
    for(nodeIndex = 0; (node = allElements[nodeIndex]); nodeIndex+=1) {
      if(node.tagName == 'svg'){ remove(node); continue; }
      if (stripUnlikelyCandidates) {
        var unlikelyMatchString = node.className + node.id + node.tagName;
        if (unlikelyMatchString.search(readability.regexps.unlikelyCandidates)
         !== -1 &&
            unlikelyMatchString.search(readability.regexps.okMaybeItsACandidate)
                === -1 &&
            node.tagName !== "BODY"){
          remove(node);
          continue;
        }
      }

      if (node.tagName === "P" || node.tagName === "TD" ||
          node.tagName === "PRE") {
        nodesToScore[nodesToScore.length] = node;
      }

      /* Turn all divs that don't have children block level elements into p's */
      if (node.tagName === "DIV") {
        if (node.innerHTML.search(readability.regexps.divToPElements) === -1) {
          var newNode = document.createElement('p');
          try {
            newNode.innerHTML = node.innerHTML;
            node.parentNode.replaceChild(newNode, node);
            nodeIndex-=1;

            nodesToScore[nodesToScore.length] = node;
          }
          catch(e) {
            dbg("Could not alter div to p, probably an IE restriction, reverting back to div.: " + e);
          }
        } else {
          /* EXPERIMENTAL */
          for(var i = 0, il = node.childNodes.length; i < il; i+=1) {
            var childNode = node.childNodes[i];
            if(childNode.nodeType === 3) { // Node.TEXT_NODE
              var p = document.createElement('p');
              p.innerHTML = childNode.nodeValue;
              p.style.display = 'inline';
              p.className = 'readability-styled';
              childNode.parentNode.replaceChild(p, childNode);
            }
          }
        }
      }
    }

    /**
     * Loop through all paragraphs, and assign a score to them based on how
     * content-y they look.
     *
     * Then add their score to their parent node.
     *
     * A score is determined by things like number of commas, class names,
     * etc. Maybe eventually link density.
     **/
    var candidates = [];
    for (var pt=0; pt < nodesToScore.length; pt+=1) {
      var parentNode      = nodesToScore[pt].parentNode;
      var grandParentNode = parentNode ? parentNode.parentNode : null;
      var innerText       = nodesToScore[pt].textContent;

      if(!parentNode || typeof(parentNode.tagName) === 'undefined') {
        continue;
      }

      /* If this paragraph is less than 25 characters, don't even count it. */
      if(innerText.length < 25) continue

      /* Initialize readability data for the parent. */
      if(typeof parentNode.readability === 'undefined') {
        readability.initializeNode(parentNode);
        candidates.push(parentNode);
      }

      /* Initialize readability data for the grandparent. */
      if(grandParentNode && typeof(grandParentNode.readability) === 'undefined' && typeof(grandParentNode.tagName) !== 'undefined') {
        readability.initializeNode(grandParentNode);
        candidates.push(grandParentNode);
      }

      var contentScore = 0;

      /* Add a point for the paragraph itself as a base. */
      contentScore+=1;

      /* Add points for any commas within this paragraph */
      contentScore += innerText.split(',').length;

      /* For every 100 characters in this paragraph, add another point. Up to 3 points. */
      contentScore += Math.min(Math.floor(innerText.length / 100), 3);

      /* Add the score to the parent. The grandparent gets half. */
      parentNode.readability.contentScore += contentScore;

      if(grandParentNode) {
        grandParentNode.readability.contentScore += contentScore/2;
      }
    }

    /**
     * After we've calculated scores, loop through all of the possible candidate nodes we found
     * and find the one with the highest score.
     **/
    var topCandidate = null;
    for(var c=0, cl=candidates.length; c < cl; c+=1)
    {
      /**
       * Scale the final candidates score based on link density. Good content should have a
       * relatively small link density (5% or less) and be mostly unaffected by this operation.
       **/
      candidates[c].readability.contentScore = candidates[c].readability.contentScore * (1-readability.getLinkDensity(candidates[c]));

      dbg('Candidate: ' + candidates[c] + " (" + candidates[c].className + ":" + candidates[c].id + ") with score " + candidates[c].readability.contentScore);

      if(!topCandidate || candidates[c].readability.contentScore > topCandidate.readability.contentScore) {
        topCandidate = candidates[c]; }
    }

    /**
     * If we still have no top candidate, just use the body as a last resort.
     * We also have to copy the body node so it is something we can modify.
     **/
    if (topCandidate === null || topCandidate.tagName === "BODY")
    {
      topCandidate = document.createElement("DIV");
      topCandidate.innerHTML = page.innerHTML;
      page.innerHTML = "";
      page.appendChild(topCandidate);
      readability.initializeNode(topCandidate);
    }

    /**
     * Now that we have the top candidate, look through its siblings for content that might also be related.
     * Things like preambles, content split by ads that we removed, etc.
     **/
    var articleContent        = document.createElement("DIV");
    if (isPaging) {
      articleContent.id     = "readability-content";
    }
    var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
    var siblingNodes          = topCandidate.parentNode.childNodes;


    for(var s=0, sl=siblingNodes.length; s < sl; s+=1) {
      var siblingNode = siblingNodes[s];
      var append      = false;

      /**
       * Fix for odd IE7 Crash where siblingNode does not exist even though this should be a live nodeList.
       * Example of error visible here: http://www.esquire.com/features/honesty0707
       **/
      if(!siblingNode) {
        continue;
      }

      dbg("Looking at sibling node: " + siblingNode + " (" + siblingNode.className + ":" + siblingNode.id + ")" + ((typeof siblingNode.readability !== 'undefined') ? (" with score " + siblingNode.readability.contentScore) : ''));
      dbg("Sibling has score " + (siblingNode.readability ? siblingNode.readability.contentScore : 'Unknown'));

      if(siblingNode === topCandidate)
      {
        append = true;
      }

      var contentBonus = 0;
      /* Give a bonus if sibling nodes and top candidates have the example same classname */
      if(siblingNode.className === topCandidate.className && topCandidate.className !== "") {
        contentBonus += topCandidate.readability.contentScore * 0.2;
      }

      if(typeof siblingNode.readability !== 'undefined' && (siblingNode.readability.contentScore+contentBonus) >= siblingScoreThreshold)
      {
        append = true;
      }

      if(siblingNode.nodeName === "P") {
        var linkDensity = readability.getLinkDensity(siblingNode);
        var nodeContent = siblingNode.textContent;
        var nodeLength  = nodeContent.length;

        if(nodeLength > 80 && linkDensity < 0.25)
        {
          append = true;
        }
        else if(nodeLength < 80 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1)
        {
          append = true;
        }
      }

      if(append) {
        dbg("Appending node: " + siblingNode);

        var nodeToAppend = null;
        if(siblingNode.nodeName !== "DIV" && siblingNode.nodeName !== "P") {
          /* We have a node that isn't a common block level element, like a form or td tag. Turn it into a div so it doesn't get filtered out later by accident. */

          dbg("Altering siblingNode of " + siblingNode.nodeName + ' to div.');
          nodeToAppend = document.createElement("DIV");
          try {
            nodeToAppend.id = siblingNode.id;
            nodeToAppend.innerHTML = siblingNode.innerHTML;
          }
          catch(er) {
            dbg("Could not alter siblingNode to div, probably an IE restriction, reverting back to original.");
            nodeToAppend = siblingNode;
            s-=1;
            sl-=1;
          }
        } else {
          nodeToAppend = siblingNode;
          s-=1;
          sl-=1;
        }

        /* To ensure a node does not interfere with readability styles, remove its classnames */
        nodeToAppend.className = "";

        /* Append sibling and subtract from our list because it removes the node when you append to another node */
        articleContent.appendChild(nodeToAppend);
      }
    }

    /**
     * So we have all of the content that we need. Now we clean it up for presentation.
     **/
    readability.prepArticle(articleContent);

    if (readability.curPageNum === 1) {
      articleContent.innerHTML = '<div id="readability-page-1" class="page">' + articleContent.innerHTML + '</div>';
    }

    /**
     * Now that we've gone through the full algorithm, check to see if we got
     * any meaningful content.
     *
     * If we didn't, we may need to re-run grabArticle with different flags
     * set. This gives us a higher likelihood of finding the content, and
     * the sieve approach gives us a higher likelihood of finding the
     * -right- content.
     **/
    if(articleContent.textContent.length < 250) {
      page.innerHTML = pageCacheHtml;

      if (readability.flagIsActive(readability.FLAG_STRIP_UNLIKELYS)) {
        readability.removeFlag(readability.FLAG_STRIP_UNLIKELYS);
        return readability.grabArticle(page);
      }
      else if (readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
        readability.removeFlag(readability.FLAG_WEIGHT_CLASSES);
        return readability.grabArticle(page);
      }
      else if (readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
        readability.removeFlag(readability.FLAG_CLEAN_CONDITIONALLY);
        return readability.grabArticle(page);
      } else {
        return null;
      }
    }

    return articleContent;
  },

  // with line breaks between paragraphs, and all the nice things
  grabArticleText: function extract(node){
    node = node || readability.grabArticle();
    if(!node) return '';
    var child, nodeName, text = '';
    for(var childIdx = 0; childIdx < node.childNodes.length; childIdx++){
      child = node.childNodes[childIdx];
      nodeName = child.nodeName.toLowerCase();
      if(nodeName == "#text"){
        text += child.nodeValue.replace(/^\n+/, "").replace(/\n+$/, "");
      } else {
        text += extract(child);
      }
    };
    nodeName = node.nodeName.toLowerCase();
    if(nodeName.match(/p|div|blockquote|h[1-6]|li/)){
      if(text[text.length - 1] != '\n') text += '\n'
      text += ' ';
    }
    return text;
  },

  /**
   * Get the number of times a string s appears in the node e.
   *
   * @param Element
   * @param string - what to split on. Default is ","
   * @return number (integer)
   **/
  getCharCount: function (e,s) {
    s = s || ",";
    return e.textContent.split(s).length-1;
  },


  /**
   * Get the density of links as a percentage of the content
   * This is the amount of text that is inside a link divided by the total text in the node.
   *
   * @param Element
   * @return number (float)
   **/
  getLinkDensity: function (e) {
    var links      = e.getElementsByTagName("a");
    var textLength = e.textContent.length;
    var linkLength = 0;
    for(var i=0, il=links.length; i<il;i+=1)
    {
      linkLength += links[i].textContent.length;
    }

    return linkLength / textLength;
  },

  /**
   * Find a cleaned up version of the current URL, to use for comparing links for possible next-pageyness.
   *
   * @author Dan Lacy
   * @return string the base url
   **/
  findBaseUrl: function () {
    var noUrlParams     = window.location.pathname.split("?")[0],
        urlSlashes      = noUrlParams.split("/").reverse(),
        cleanedSegments = [],
        possibleType    = "";

    for (var i = 0, slashLen = urlSlashes.length; i < slashLen; i+=1) {
      var segment = urlSlashes[i];

      // Split off and save anything that looks like a file type.
      if (segment.indexOf(".") !== -1) {
        possibleType = segment.split(".")[1];

        /* If the type isn't alpha-only, it's probably not actually a file extension. */
        if(!possibleType.match(/[^a-zA-Z]/)) {
          segment = segment.split(".")[0];
        }
      }

      /**
       * EW-CMS specific segment replacement. Ugly.
       * Example: http://www.ew.com/ew/article/0,,20313460_20369436,00.html
       **/
      if(segment.indexOf(',00') !== -1) {
        segment = segment.replace(',00', '');
      }

      // If our first or second segment has anything looking like a page number, remove it.
      if (segment.match(/((_|-)?p[a-z]*|(_|-))[0-9]{1,2}$/i) && ((i === 1) || (i === 0))) {
        segment = segment.replace(/((_|-)?p[a-z]*|(_|-))[0-9]{1,2}$/i, "");
      }


      var del = false;

      /* If this is purely a number, and it's the first or second segment, it's probably a page number. Remove it. */
      if (i < 2 && segment.match(/^\d{1,2}$/)) {
        del = true;
      }

      /* If this is the first segment and it's just "index", remove it. */
      if(i === 0 && segment.toLowerCase() === "index") {
        del = true;
      }

      /* If our first or second segment is smaller than 3 characters, and the first segment was purely alphas, remove it. */
      if(i < 2 && segment.length < 3 && !urlSlashes[0].match(/[a-z]/i)) {
        del = true;
      }

      /* If it's not marked for deletion, push it to cleanedSegments. */
      if (!del) {
        cleanedSegments.push(segment);
      }
    }

    // This is our final, cleaned, base article URL.
    return window.location.protocol + "//" + window.location.host + cleanedSegments.reverse().join("/");
  },

  // Look for any paging links that may occur within the document.
  findNextPageLink: function (elem) {
    var possiblePages = {},
        allLinks = elem.getElementsByTagName('a'),
        articleBaseUrl = readability.findBaseUrl();

    /**
     * Loop through all links, looking for hints that they may be next-page
     * links. Things like having "page" in their textContent, className or
     * id, or being a child of a node with a page-y className or id.
     *
     * Also possible: levenshtein distance? longest common subsequence?
     *
     * After we do that, assign each page a score, and
     **/
    for(var i = 0, il = allLinks.length; i < il; i+=1) {
      var link     = allLinks[i],
          linkHref = allLinks[i].href.replace(/#.*$/, '').replace(/\/$/, '');

      /* If we've already seen this page, ignore it */
      if(linkHref === "" || linkHref === articleBaseUrl || linkHref === window.location.href || linkHref in readability.parsedPages) {
        continue;
      }

      /* If it's on a different domain, skip it. */
      if(window.location.host !== linkHref.split(/\/+/g)[1]) {
        continue;
      }

      var linkText = link.textContent;

      /* If the linkText looks like it's not the next page, skip it. */
      if(linkText.match(readability.regexps.extraneous) || linkText.length > 25) {
        continue;
      }

      /* If the leftovers of the URL after removing the base URL don't contain any digits, it's certainly not a next page link. */
      var linkHrefLeftover = linkHref.replace(articleBaseUrl, '');
      if(!linkHrefLeftover.match(/\d/)) {
        continue;
      }

      if(!(linkHref in possiblePages)) {
        possiblePages[linkHref] = {"score": 0, "linkText": linkText, "href": linkHref};
      } else {
        possiblePages[linkHref].linkText += ' | ' + linkText;
      }

      var linkObj = possiblePages[linkHref];

      /**
       * If the articleBaseUrl isn't part of this URL, penalize this link. It could still be the link, but the odds are lower.
       * Example: http://www.actionscript.org/resources/articles/745/1/JavaScript-and-VBScript-Injection-in-ActionScript-3/Page1.html
       **/
      if(linkHref.indexOf(articleBaseUrl) !== 0) {
        linkObj.score -= 25;
      }

      var linkData = linkText + ' ' + link.className + ' ' + link.id;
      if(linkData.match(readability.regexps.nextLink)) {
        linkObj.score += 50;
      }
      if(linkData.match(/pag(e|ing|inat)/i)) {
        linkObj.score += 25;
      }
      if(linkData.match(/(first|last)/i)) { // -65 is enough to negate any bonuses gotten from a > or » in the text,
        /* If we already matched on "next", last is probably fine. If we didn't, then it's bad. Penalize. */
        if(!linkObj.linkText.match(readability.regexps.nextLink)) {
          linkObj.score -= 65;
        }
      }
      if(linkData.match(readability.regexps.negative) || linkData.match(readability.regexps.extraneous)) {
        linkObj.score -= 50;
      }
      if(linkData.match(readability.regexps.prevLink)) {
        linkObj.score -= 200;
      }

      /* If a parentNode contains page or paging or paginat */
      var parentNode = link.parentNode,
          positiveNodeMatch = false,
          negativeNodeMatch = false;
      while(parentNode) {
        var parentNodeClassAndId = parentNode.className + ' ' + parentNode.id;
        if(!positiveNodeMatch && parentNodeClassAndId && parentNodeClassAndId.match(/pag(e|ing|inat)/i)) {
          positiveNodeMatch = true;
          linkObj.score += 25;
        }
        if(!negativeNodeMatch && parentNodeClassAndId && parentNodeClassAndId.match(readability.regexps.negative)) {
          /* If this is just something like "footer", give it a negative. If it's something like "body-and-footer", leave it be. */
          if(!parentNodeClassAndId.match(readability.regexps.positive)) {
            linkObj.score -= 25;
            negativeNodeMatch = true;
          }
        }

        parentNode = parentNode.parentNode;
      }

      /**
       * If the URL looks like it has paging in it, add to the score.
       * Things like /page/2/, /pagenum/2, ?p=3, ?page=11, ?pagination=34
       **/
      if (linkHref.match(/p(a|g|ag)?(e|ing|ination)?(=|\/)[0-9]{1,2}/i) || linkHref.match(/(page|paging)/i)) {
        linkObj.score += 25;
      }

      /* If the URL contains negative values, give a slight decrease. */
      if (linkHref.match(readability.regexps.extraneous)) {
        linkObj.score -= 15;
      }

            /**
             * Minor punishment to anything that doesn't match our current URL.
             * NOTE: I'm finding this to cause more harm than good where something is exactly 50 points.
             *       Dan, can you show me a counterexample where this is necessary?
             * if (linkHref.indexOf(window.location.href) !== 0) {
             *    linkObj.score -= 1;
             * }
            **/

            /**
             * If the link text can be parsed as a number, give it a minor bonus, with a slight
             * bias towards lower numbered pages. This is so that pages that might not have 'next'
             * in their text can still get scored, and sorted properly by score.
            **/
            var linkTextAsNumber = parseInt(linkText, 10);
            if(linkTextAsNumber) {
                // Punish 1 since we're either already there, or it's probably before what we want anyways.
                if (linkTextAsNumber === 1) {
                    linkObj.score -= 10;
                }
                else {
                    // Todo: Describe this better
                    linkObj.score += Math.max(0, 10 - linkTextAsNumber);
                }
            }
        }

        /**
         * Loop thrugh all of our possible pages from above and find our top candidate for the next page URL.
         * Require at least a score of 50, which is a relatively high confidence that this page is the next link.
        **/
        var topPage = null;
        for(var page in possiblePages) {
            if(possiblePages.hasOwnProperty(page)) {
                if(possiblePages[page].score >= 50 && (!topPage || topPage.score < possiblePages[page].score)) {
                    topPage = possiblePages[page];
                }
            }
        }

        if(topPage) {
            var nextHref = topPage.href.replace(/\/$/,'');

            dbg('NEXT PAGE IS ' + nextHref);
            readability.parsedPages[nextHref] = true;
            return nextHref;
        }
        else {
            return null;
        }
    },

    xhr: function () {
        if (typeof XMLHttpRequest !== 'undefined' && (window.location.protocol !== 'file:' || !window.ActiveXObject)) {
            return new XMLHttpRequest();
        }
        else {
            try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(sixerr) { }
            try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(threrr) { }
            try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(err) { }
        }

        return false;
    },

    successfulRequest: function (request) {
        return (request.status >= 200 && request.status < 300) || request.status === 304 || (request.status === 0 && request.responseText);
    },

    ajax: function (url, options) {
        var request = readability.xhr();

        request.onreadystatechange = function (readyState) {
            if (request.readyState === 4) {
                if (readability.successfulRequest(request)) {
                    if (options.success) { options.success(request); }
                }
                else {
                    if (options.error) { options.error(request); }
                }
            }
        };

        if (typeof options === 'undefined') { options = {}; }

        request.open('get', url, true);
        request.setRequestHeader('Accept', 'text/html');

        try {
            request.send(options.postBody);
        }
        catch (e) {
            if (options.error) options.error();
        }

        return request;
    },

    /**
     * Make an AJAX request for each page and append it to the document.
    **/
    curPageNum: 1,

    appendNextPage: function (nextPageLink) {
        readability.curPageNum+=1;

        var articlePage       = document.createElement("DIV");
        articlePage.id        = 'readability-page-' + readability.curPageNum;
        articlePage.className = 'page';
        articlePage.innerHTML = '<p class="page-separator" title="Page ' + readability.curPageNum + '">&sect;</p>';

        document.getElementById("readability-content").appendChild(articlePage);

        if(readability.curPageNum > readability.maxPages) {
            var nextPageMarkup = "<div style='text-align: center'><a href='" + nextPageLink + "'>View Next Page</a></div>";

            articlePage.innerHTML = articlePage.innerHTML + nextPageMarkup;
            return;
        }

        /**
         * Now that we've built the article page DOM element, get the page content
         * asynchronously and load the cleaned content into the div we created for it.
        **/
        (function(pageUrl, thisPage) {
            readability.ajax(pageUrl, {
                success: function(r) {

                    /* First, check to see if we have a matching ETag in headers - if we do, this is a duplicate page. */
                    var eTag = r.getResponseHeader('ETag');
                    if(eTag) {
                        if(eTag in readability.pageETags) {
                            dbg("Exact duplicate page found via ETag. Aborting.");
                            articlePage.style.display = 'none';
                            return;
                        } else {
                            readability.pageETags[eTag] = 1;
                        }
                    }

                  // TODO: this ends up doubling up page numbers on NYTimes
                  // articles. Need to generically parse those away.
                  var page = document.createElement("DIV");

                    /**
                     * Do some preprocessing to our HTML to make it ready for
                     * appending.
                     * • Remove any script tags. Swap and reswap newlines with
                     *   a unicode character because multiline regex doesn't work
                     *    in javascript.
                     * • Turn any noscript tags into divs so that we can parse
                     *    them. This allows us to find any next page links
                     *    hidden via javascript.
                     * • Turn all double br's into p's - was handled by
                     *   prepDocument in the original view.
                     *
                     * Maybe in the future abstract out prepDocument to work
                     * for both the original document and AJAX-added pages.
                    **/
                    var responseHtml = r.responseText.replace(/\n/g,'\uffff')
                                       .replace(/<script.*?>.*?<\/script>/gi, '');
                    responseHtml = responseHtml.replace(/\n/g,'\uffff')
                                   .replace(/<script.*?>.*?<\/script>/gi, '');
                    responseHtml = responseHtml.replace(/\uffff/g,'\n')
                                   .replace(/<(\/?)noscript/gi, '<$1div');
                    responseHtml = responseHtml.replace(
                      readability.regexps.replaceBrs, '</p><p>');
                    responseHtml = responseHtml.replace(
                      readability.regexps.replaceFonts, '<$1span>');

                    page.innerHTML = responseHtml;

                    /**
                     * Reset all flags for the next page, as they will search
                     * through it and disable as necessary at the end of
                     *  grabArticle.
                    **/
                    readability.flags = 0x1 | 0x2 | 0x4;

                    var nextPageLink = readability.findNextPageLink(page),
                        content      =  readability.grabArticle(page);

                    if(!content) {
                        dbg("No content found in page to append. Aborting.");
                        return;
                    }

                    /**
                     * Anti-duplicate mechanism. Essentially, get the first
                     *  paragraph of our new page.
                     * Compare it against all of the the previous document's
                     *  we've gotten. If the previous
                     * document contains exactly the innerHTML of this first
                     *  paragraph, it's probably a duplicate.
                    **/
                    var firstP = content.getElementsByTagName("P").length ?
                      content.getElementsByTagName("P")[0] : null;
                    if(firstP && firstP.innerHTML.length > 100) {
                        for(var i=1; i <= readability.curPageNum; i+=1) {
                            var rPage = document.getElementById('readability-page-' + i);
                            if(rPage &&
                                rPage.innerHTML.indexOf(firstP.innerHTML) !== -1) {
                                dbg('Duplicate of page ' + i + ' - skipping.');
                                articlePage.style.display = 'none';
                                readability.parsedPages[pageUrl] = true;
                                return;
                            }
                        }
                    }

                    readability.removeScripts(content);

                    thisPage.innerHTML = thisPage.innerHTML + content.innerHTML;

                    if(nextPageLink) {
                        readability.appendNextPage(nextPageLink);
                    }
                }
            });
        }(nextPageLink, articlePage));
    },

    /**
     * Get an elements class/id weight. Uses regular expressions to tell if this
     * element looks good or bad.
     *
     * @param Element
     * @return number (Integer)
    **/
    getClassWeight: function (e) {
        if(!readability.flagIsActive(readability.FLAG_WEIGHT_CLASSES)) {
            return 0;
        }

        var weight = 0;

        /* Look for a special classname */
        if (typeof(e.className) === 'string' && e.className !== '')
        {
            if(e.className.search(readability.regexps.negative) !== -1) {
                weight -= 25; }

            if(e.className.search(readability.regexps.positive) !== -1) {
                weight += 25; }
        }

        /* Look for a special ID */
        if (typeof(e.id) === 'string' && e.id !== '') {
            if(e.id.search(readability.regexps.negative) !== -1)
                weight -= 25;

            if(e.id.search(readability.regexps.positive) !== -1)
                weight += 25;
        }
        return weight;
    },

    nodeIsVisible: function (node) {
        return (node.offsetWidth !== 0 || node.offsetHeight !== 0) &&
        node.style.display.toLowerCase() !== 'none';
    },

    // Remove extraneous break tags from a node.
    killBreaks: function (e) {
        try {
            e.innerHTML = e.innerHTML
                          .replace(readability.regexps.killBreaks,'<br />');
        }
        catch (eBreaks) {
            dbg("KillBreaks failed - this is an IE bug. Ignoring.: " + eBreaks);
        }
    },

    // Clean a node of all elements of type "tag".
    // (Unless it's a youtube/vimeo video. People love movies.)
    clean: function (e, tag) {
        var targetList = e.getElementsByTagName( tag );
        var isEmbed    = (tag === 'object' || tag === 'embed');

        for (var y=targetList.length-1; y >= 0; y-=1) {
            /* Allow youtube and vimeo videos through as people usually want to see those. */
            if(isEmbed) {
                var attributeValues = "";
                for (var i=0, il=targetList[y].attributes.length; i < il; i+=1) {
                    attributeValues += targetList[y].attributes[i].value + '|';
                }

                /* First, check the elements attributes to see if any of
                 * them contain youtube or vimeo */
                if (attributeValues.search(readability.regexps.videos) !== -1) {
                    continue;
                }

                /* Then check the elements inside this element for the same. */
                if (targetList[y].innerHTML.search(readability.regexps.videos)
                 !== -1) continue;
            }

            targetList[y].parentNode.removeChild(targetList[y]);
        }
    },

    /**
     * Clean an element of all tags of type "tag" if they look fishy.
     * "Fishy" is an algorithm based on content length, classnames,
     * link density, number of images & embeds, etc.
     *
     * @return void
     **/
    cleanConditionally: function (e, tag) {

        if(!readability.flagIsActive(readability.FLAG_CLEAN_CONDITIONALLY)) {
            return;
        }

        var tagsList      = e.getElementsByTagName(tag);
        var curTagsLength = tagsList.length;

        /**
         * Gather counts for other typical elements embedded within.
         * Traverse backwards so we can remove nodes at the same time
         *  without effecting the traversal.
         *
         * TODO: Consider taking into account original contentScore here.
        **/
        for (var i=curTagsLength-1; i >= 0; i-=1) {
            var weight = readability.getClassWeight(tagsList[i]);
            var contentScore = (typeof tagsList[i].readability !== 'undefined') ?
            tagsList[i].readability.contentScore : 0;

            dbg("Cleaning Conditionally " + tagsList[i] +
                " (" + tagsList[i].className + ":" + tagsList[i].id + ")" +
                ((typeof tagsList[i].readability !== 'undefined') ?
                    (" with score " + tagsList[i].readability.contentScore) : ''));

            if(weight+contentScore < 0)
            {
                tagsList[i].parentNode.removeChild(tagsList[i]);
            }
            else if ( readability.getCharCount(tagsList[i],',') < 10) {
                /**
                 * If there are not very many commas, and the number of
                 * non-paragraph elements is more than paragraphs or other
                 *  ominous signs, remove the element.
                **/
                var p      = tagsList[i].getElementsByTagName("p").length;
                var img    = tagsList[i].getElementsByTagName("img").length;
                var li     = tagsList[i].getElementsByTagName("li").length-100;
                var input  = tagsList[i].getElementsByTagName("input").length;

                var embedCount = 0;
                var embeds     = tagsList[i].getElementsByTagName("embed");
                for(var ei=0,il=embeds.length; ei < il; ei+=1) {
                    if (embeds[ei].src.search(readability.regexps.videos) === -1) {
                      embedCount+=1;
                    }
                }

                var linkDensity   = readability.getLinkDensity(tagsList[i]);
                var contentLength = tagsList[i].textContent.length;
                var toRemove      = false;

                if ( img > p ) {
                    toRemove = true;
                } else if(li > p && tag !== "ul" && tag !== "ol") {
                    toRemove = true;
                } else if( input > Math.floor(p/3) ) {
                    toRemove = true;
                } else if(contentLength < 25 && (img === 0 || img > 2) ) {
                    toRemove = true;
                } else if(weight < 25 && linkDensity > 0.2) {
                    toRemove = true;
                } else if(weight >= 25 && linkDensity > 0.5) {
                    toRemove = true;
                } else if((embedCount === 1 && contentLength < 75) || embedCount > 1) {
                    toRemove = true;
                }

                if(toRemove) {
                    tagsList[i].parentNode.removeChild(tagsList[i]);
                }
            }
        }
    },

    /**
     * Clean out spurious headers from an Element. Checks things like classnames
     * and link density.
     *
     * @param Element
     * @return void
    **/
    cleanHeaders: function (e) {
        for (var headerIndex = 1; headerIndex < 3; headerIndex+=1) {
            var headers = e.getElementsByTagName('h' + headerIndex);
            for (var i=headers.length-1; i >=0; i-=1) {
                if (readability.getClassWeight(headers[i]) < 0 ||
                    readability.getLinkDensity(headers[i]) > 0.33) {
                    headers[i].parentNode.removeChild(headers[i]);
                }
            }
        }
    },

    flagIsActive: function(flag) {
        return (readability.flags & flag) > 0;
    },

    removeFlag: function(flag) {
        readability.flags = readability.flags & ~flag;
    }
};

document.dispatchEvent(new Event('readability.ready'));