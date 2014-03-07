(function(){
  var sq = {};
  (function makeSquirt(read, makeGUI) {
    var host = window.location.search.indexOf('sq-dev') != -1 ? '/' :
      '//rawgithub.com/cameron/squirt/master/';

    makeEl('meta', {'apple-mobile-web-app-capable': 'yes'}, document.head);
    var ss = injectStylesheet(host + 'squirt.css')
    injectStylesheet('//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css');

    on('squirt.again', startSquirt);
    on(ss, 'load', function(){
      makeGUI();
      startSquirt();
    })

    function startSquirt(){
      showGUI();
      var selection = window.getSelection();
      if(selection.type == 'Range') {
        return read((function getSelectedText(){
          var container = document.createElement("div");
          for (var i = 0, len = selection.rangeCount; i < len; ++i) {
            container.appendChild(selection.getRangeAt(i).cloneContents());
          }
          return container.textContent;
        })());
      }
      function readabilize(){ read(readability.grabArticle().textContent); }
      if(!window.readability){
        var script = makeEl('script', {
          src: host + 'readability.js'
        }, document.head);
        return on('readability.ready', readabilize);
      }
      readabilize();
    };
  })(makeRead(makeTextToNodes(wordToNode)), makeGUI);

  function makeRead(textToNodes) {
    return function read(text) {
      var nodes = textToNodes(text);
      var lastNode = null;
      var timeoutId;
      var nodeIdx = 0;
      var incrememntNodeIdx = function(increment){
        var ret = nodeIdx;
        nodeIdx += increment || 1;
        nodeIdx = Math.max(0, nodeIdx);
        prerender();
        return ret;
      }
      var waitAfterComma = 2;
      var waitAfterPeriod = 3;
      var lastChar, delay;
      var container = document.querySelector('.sq-word-center');
      var prerenderer = makeDiv({'class': 'sq-word-prerenderer'}, container);
      map(container.children, function(child){
        child.classList.contains('sq-word') && child.remove();
      });
      var jumped = false;
      var postJumpDelay = 1;
      sq.paused = false;

      on('squirt.close', function(){
        clearTimeout(timeoutId);
      });

      var ms;
      var wpm = function(wpm){
        ms = 60 * 1000 / wpm ;
      }
      on('squirt.wpm', function(e){
        sq.wpm = e.value
        wpm(e.value);
        dispatch('squirt.wpm.after');
      });

      on('squirt.pause', function(){
        dispatch('squirt.play', {value: false});
      });

      on('squirt.play', play);

      on('squirt.play.toggle', function(){
        dispatch('squirt.play', {value: sq.paused});
      });

      dispatch('squirt.wpm', {value: 400});

      on('squirt.rewind', function(e){
        // Rewind by `e.value` seconds. Then walk back to the
        // beginning of the sentence.
        if(e.value == -1) nodeIdx = 0;
        else {
          incrememntNodeIdx(-Math.floor(e.value * 1000 / ms));
          while(nodes[nodeIdx].word.indexOf('.') == -1 && nodeIdx != 0){
            incrememntNodeIdx(-1);
          }
          nodeIdx != 0 && incrememntNodeIdx();
        }
        jumped = true;
      });

      function play(e){
        sq.paused = e.value === undefined ? false : !e.value;
        !sq.paused && nextNode();
        dispatch('squirt.play.after');
      };

      function prerender(){
        prerenderer.appendChild(nodes[nodeIdx]);
        nodes[nodeIdx].center();
      }

      function nextNode() {
        if(sq.paused) return;
        lastNode && lastNode.remove();
        var nextIdx = incrememntNodeIdx();
        if(nextIdx >= nodes.length) return;
        lastNode = nodes[nextIdx];
        container.appendChild(lastNode);
        delay = getDelay(lastNode, jumped);
        jumped = false;
        nodeIdx != nodes.length && (timeoutId = setTimeout(nextNode, ms * delay))
      };

      function getDelay(node, jumped){
        if(jumped) return waitAfterPeriod;
        if(lastNode.word == "Mr." ||
            lastNode.word == "Mrs." ||
            lastNode.word == "Ms.") return 1;
        var lastChar = node.word[node.word.length - 1];
        if('.!?'.indexOf(lastChar) != -1) return waitAfterPeriod;
        if(',;:'.indexOf(lastChar) != -1) return waitAfterComma;
        return 1;
      };

      prerender();
      dispatch('squirt.play');
    };
  };

  function makeTextToNodes(wordToNode) {
    return function textToNodes(text) {
      text = "3. 2. 1. " + text;
      var words, node
      return text.replace('\n', ' ').split(' ')
             .map(function(word){
               // handle "...end of one.Next sentence..."
               // due to using textContent to extract -- does not add newlines.
               // E.g., <p>this is a sentence.</p><p>Followed...</p> will return
               // "...sentence.Followed..."
               words = word.split('.');
               if(words.length > 1) words[0] += '.';
               if(words.length > 1 && !words[1].length) words.pop();
               return words;
             })
             .reduce(function(left, right){
               return left.concat(right[0]);
             }, [])
             .filter(function(word){ return word.length; })
             .map(wordToNode);
    };
  };

  function wordToNode(word) {
    var node = makeDiv({'class': 'sq-word'});
    var span;

    var centerOnCharIdx =
      word.length == 1 ? 0 :
      (word.length == 2 ? 1 :
          (word.length == 3 ? 1 :
              Math.floor(word.length / 2) - 1));

    word.split('').map(function(char, idx) {
      span = makeEl('span', {}, node);
      span.textContent = char;
      if(idx == centerOnCharIdx) span.classList.add('sq-orp');
    });

    var centerOnSpan = node.children[centerOnCharIdx];
    node.center = function() {
      var val = centerOnSpan.offsetLeft + (centerOnSpan.offsetWidth / 2);
      node.style.left = "-" + val + "px";
    }
    node.word = word;
    return node;
  };

  function showGUI(){
    blur();
    document.getElementById('squirt').style.display = 'block';
  };

  function hideGUI(){
    unblur();
    document.getElementById('squirt').style.display = 'none';
  };

  function blur(){
    map(document.body.children, function(node){
      if(node.id != 'squirt')
        node.classList.add('sq-blur');
    });
  };

  function unblur(){
    map(document.body.children, function(node){
      node.classList.remove('sq-blur');
    });
  }

  function makeGUI(){
    var squirt = makeDiv({id: 'squirt'}, document.body);
    squirt.style.display = 'none';
    on('squirt.close', hideGUI);

    var obscure = makeDiv({class: 'sq-obscure'}, squirt);
    on(obscure, 'click', function(){
      window.squirted = null;
      dispatch('squirt.close');
    });

    var squirtWin = makeDiv({'class': 'sq-modal'}, squirt);
    var port = makeDiv({'class': 'sq-word-port'}, squirtWin);
    var container = makeDiv({'class': 'sq-word-center'}, port);
    var indicator = makeDiv({'class': 'sq-focus-indicator'}, container);
    var controls = makeDiv({'class':'sq-controls'}, squirtWin);

    (function make(controls){

      // this code is suffering from delirium
      (function makeWPMSelect(){

        // create the ever-present left-hand side button
        var control = makeDiv({'class': 'sq-wpm sq-control'}, controls);
        var wpmLink = makeEl('a', {}, control);
        bind("=wpm WPM", sq, wpmLink);
        on('squirt.wpm.after', wpmLink.render);
        on(control, 'click', function(){
          toggle(wpmSelector) ?
            dispatch('squirt.pause') :
            dispatch('squirt.play');
        });

        // create the custom selector
        var wpmSelector = makeDiv({'class': 'sq-wpm-selector'}, controls);
        wpmSelector.style.display = 'none';
        var plus50OptData = {add: 50, sign: "+"};
        var datas = [];
        for(var wpm = 200; wpm < 1000; wpm += 100){
          var opt = makeDiv({'class': 'sq-wpm-option'}, wpmSelector);
          var a = makeEl('a', {}, opt);
          a.data = { baseWPM: wpm };
          a.data.__proto__ = plus50OptData;
          datas.push(a.data);
          bind("=wpm",  a.data, a);
          on(opt, 'click', function(e){
            dispatch('squirt.wpm', {value: e.target.firstChild.data.wpm});
            dispatch('squirt.play');
            wpmSelector.style.display = 'none';
          });
        };

        // create the last option for the custom selector
        var plus50Opt = makeDiv({'class': 'sq-wpm-option sq-plus-50'}, wpmSelector);
        var a = makeEl('a', {}, plus50Opt);
        bind("=sign 50", plus50OptData, a);
        on(plus50Opt, 'click', function(){
          datas.map(function(data){
            data.wpm = data.baseWPM + data.add;
          });
          var toggle = plus50OptData.sign == '+';
          plus50OptData.sign = toggle ? '-' : '+';
          plus50OptData.add = toggle ? 0 : 50;
          dispatch('squirt.els.render');
        });
        dispatch('click', {}, plus50Opt);
      })();

      (function makeRewind(){
        var container = makeEl('div', {'class': 'sq-rewind sq-control'}, controls);
        var a = makeEl('a', {}, container);
        a.href = '#';
        on(container, 'click', function(e){
          dispatch('squirt.rewind', {value: 10});
          e.preventDefault();
        });
        a.innerHTML = "<i class='fa fa-backward'></i> 10s";
      })();

      (function makePause(){
        var container = makeEl('div', {'class': 'sq-pause sq-control'}, controls);
        var a = makeEl('a', {'href': '#'}, container);
        var pauseIcon = "<i class='fa fa-pause'></i>";
        var playIcon = "<i class='fa fa-play'></i>";
        function updateIcon(){
          a.innerHTML = sq.paused ? playIcon : pauseIcon;
        }
        on('squirt.play.after', updateIcon);
        on(container, 'click', function(clickEvt){
          dispatch('squirt.play.toggle');
          clickEvt.preventDefault();
        });
        updateIcon();
      })();
    })(controls);
  };

  // utilites
  function map(listLike, f){
    listLike = Array.prototype.slice.call(listLike); // for safari
    return Array.prototype.map.call(listLike, f);
  }

  function makeEl(type, attrs, parent) {
    var el = document.createElement(type);
    for(var k in attrs){
      if(!attrs.hasOwnProperty(k)) continue;
      el.setAttribute(k, attrs[k]);
    }
    parent && parent.appendChild(el);
    return el;
  };

  // data binding... *cough*
  function bind(expr, data, el){
    el.render = render.bind(null, expr, data, el);
    return on('squirt.els.render', function(){
      el.render();
    });
  };

  function render(expr, data, el){
    var match, rendered = expr;
    expr.match(/=[^ =]+/g).map(function(match){
      var val = data[match.substr(1)];
      rendered = rendered.replace(match, val == undefined ? '' : val);
    });
    el.textContent = rendered;
  };

  function makeDiv(attrs, parent){
    return makeEl('div', attrs, parent);
  };

  function injectStylesheet(url){
    return makeEl('link', {
      rel: 'stylesheet',
      href: url,
      type: 'text/css'
    }, document.head);
  };

  function on(bus, evts, cb){
    if(cb === undefined){
      cb = evts;
      evts = bus;
      bus = document;
    }
    evts = typeof evts == 'string' ? [evts] : evts;
    return evts.map(function(evt){
      return bus.addEventListener(evt, cb);
    });
  };

  function dispatch(evt, attrs, dispatcher){
    var evt = new Event(evt);
    for(var k in attrs){
      if(!attrs.hasOwnProperty(k)) continue
      evt[k] = attrs[k];
    }
    (dispatcher || document).dispatchEvent(evt);
  };

  function toggle(el){
    var s = el.style;
    return (s.display = s.display == 'none' ? 'block' : 'none') == 'block';
  }
})();
