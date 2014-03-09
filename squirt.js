var sq = {};
sq.version = '0.0.1';
sq.userId = 'cameron-dev';
(function(Keen){
  Keen.addEvent('load');
  (function makeSquirt(read, makeGUI) {
    var host = window.location.search.indexOf('sq-dev') != -1 ?
      '//localhost:4000/' : '//www.squirt.io/';

    var ss = injectStylesheet(host + 'squirt.css')
    injectStylesheet('//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css');

    on('squirt.again', startSquirt);
    on(ss, 'load', function(){
      makeGUI();
      startSquirt();
    })

    function startSquirt(){
      Keen.addEvent('start');
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
      function readabilize(){ read(readability.grabArticleText()); }
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
    var nodes;
    var lastNode = null;
    var timeoutId;
    var nodeIdx;
    var incrememntNodeIdx = function(increment){
      var ret = nodeIdx;
      nodeIdx += increment || 1;
      nodeIdx = Math.max(0, nodeIdx);
      prerender();
      return ret;
    };
    var waitAfterComma = 2;
    var waitAfterPeriod = 3;
    var waitAfterParagraph = 3.5;
    var wordContainer;
    var prerenderer;
    sq.paused = false;

    var intervalMs;
    var wpm = function(wpm){
      intervalMs = 60 * 1000 / wpm ;
    };

    (function readerEventHandlers(){
      on('squirt.close', function(){
        clearTimeout(timeoutId);
        Keen.addEvent('close');
      });

      on('squirt.wpm', function(e){
        sq.wpm = e.value
        wpm(e.value);
        dispatch('squirt.wpm.after');
        e.notForKeen == undefined && Keen.addEvent('wpm', {'wpm': sq.wpm});
      });

      on('squirt.pause', pause);
      on('squirt.play', play);

      on('squirt.play.toggle', function(){
        dispatch(sq.paused ? 'squirt.play' : 'squirt.pause');
      });

      on('squirt.rewind', function(e){
        // Rewind by `e.value` seconds. Then walk back to the
        // beginning of the sentence.
        clearTimeout(timeoutId);
        incrememntNodeIdx(-Math.floor(e.seconds * 1000 / intervalMs));
        while(nodes[nodeIdx].word.indexOf('.') == -1 && nodeIdx < 0){
          incrememntNodeIdx(-1);
        }
        nextNode(true);
        Keen.addEvent('rewind');
      });
    })();

    function pause(){
      sq.paused = true;
      dispatch('squirt.pause.after');
      clearTimeout(timeoutId);
      Keen.addEvent('pause');
    };

    function play(e){
      sq.paused = false;
      dispatch('squirt.pause.after');
      nextNode()
      Keen.addEvent('play');
    };

    var toRender;
    function prerender(){
      toRender = nodes[nodeIdx];
      if(toRender == null) return;
      prerenderer.appendChild(toRender);
      nodes[nodeIdx].center();
    }

    var delay, jumped, nextIdx;
    function nextNode(jumped) {
      lastNode && lastNode.remove();

      nextIdx = incrememntNodeIdx();
      if(nextIdx >= nodes.length) { Keen.addEvent('final-word'); return; }

      lastNode = nodes[nextIdx];
      wordContainer.appendChild(lastNode);
      timeoutId = setTimeout(nextNode, intervalMs * getDelay(lastNode, jumped));
    };

    function getDelay(node, jumped){
      if(jumped) return waitAfterPeriod;
      var lastChar = node.word[node.word.length - 1];
      if(lastChar == '\n') return waitAfterParagraph;
      if(lastNode.word == "Mr." ||
          lastNode.word == "Mrs." ||
          lastNode.word == "Ms.") return 1;
      if('.!?'.indexOf(lastChar) != -1) return waitAfterPeriod;
      if(',;:'.indexOf(lastChar) != -1) return waitAfterComma;

      return 1;
    };

    dispatch('squirt.wpm', {value: 400, notForKeen: true});
    return function read(text) {
      wordContainer = document.querySelector('.sq-word-container');
      map(wordContainer.querySelectorAll('.sq-word'), function(wordNode){
        wordNode.remove();
      });
      prerenderer = prerenderer ? prerenderer
                  : makeDiv({'class': 'sq-word-prerenderer'}, wordContainer);
      nodes = textToNodes(text);
      debugger;
      nodeIdx = 0;

      prerender();
      dispatch('squirt.play');
    };
  };

  function makeTextToNodes(wordToNode) {
    return function textToNodes(text) {
      text = "3\n 2\n 1\n " + text.trim('\n');
      return text
             .split(' ')
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
    if(!centerOnSpan) debugger;
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
      window.squirted = true;
      dispatch('squirt.close');
      Keen.addEvent('close');
    });

    var modal = makeDiv({'class': 'sq-modal'}, squirt);
    var controls = makeDiv({'class':'sq-controls'}, modal);
    var reader = makeDiv({'class': 'sq-reader'}, modal);
    var wordContainer = makeDiv({'class': 'sq-word-container'}, reader);
    makeDiv({'class': 'sq-focus-indicator-gap'}, wordContainer);

    (function make(controls){

      // this code is suffering from delirium
      (function makeWPMSelect(){

        // create the ever-present left-hand side button
        var control = makeDiv({'class': 'sq-wpm sq-control'}, controls);
        var wpmLink = makeEl('a', {}, control);
        bind("{{wpm}} WPM", sq, wpmLink);
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
          bind("{{wpm}}",  a.data, a);
          on(opt, 'click', function(e){
            dispatch('squirt.wpm', {value: e.target.firstChild.data.wpm});
            dispatch('squirt.play');
            wpmSelector.style.display = 'none';
          });
        };

        // create the last option for the custom selector
        var plus50Opt = makeDiv({'class': 'sq-wpm-option sq-wpm-plus-50'}, wpmSelector);
        var a = makeEl('a', {}, plus50Opt);
        bind("{{sign}}50", plus50OptData, a);
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
          dispatch('squirt.rewind', {seconds: 10});
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
        on('squirt.pause.after', updateIcon);
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
    expr.match(/{{[^}]+}}/g).map(function(match){
      var val = data[match.substr(2, match.length - 4)];
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
})((function injectKeen(){
  window.Keen=window.Keen||{configure:function(e){this._cf=e},addEvent:function(e,t,n,i){this._eq=this._eq||[],this._eq.push([e,t,n,i])},setGlobalProperties:function(e){this._gp=e},onChartsReady:function(e){this._ocrq=this._ocrq||[],this._ocrq.push(e)}};(function(){var e=document.createElement("script");e.type="text/javascript",e.async=!0,e.src=("https:"==document.location.protocol?"https://":"http://")+"dc8na2hxrj29i.cloudfront.net/code/keen-2.1.0-min.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)})();

  var Keen = window.Keen;
  Keen.configure({
    projectId: "531aa8c136bf5a0f8e000003",
    writeKey: "a863509cd0ba1c7039d54e977520462be277d525f29e98798ae4742b963b22ede0234c467494a263bd6d6b064413c29cd984e90e6e6a4468d36fed1b04bcfce6f19f50853e37b45cb283b4d0dfc4c6e7a9a23148b1696d7ea2624f1c907abfac23a67bbbead623522552de3fedced628"
  });

  function addon(name, input, output){
    return { name: name, input: input, output: output};
  }

  function guid(){
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  Keen.setGlobalProperties(function(){
    var props = {
      userId: sq.userId,
      href: window.location.href,
      rawUserAgent: "${keen.user_agent}",
      sessionId: guid(),
      ip: "${keen.ip}",
      keen: { addons: [] },
      referrer: document.referrer,
      app_version: sq.version
    };
    var push = Array.prototype.push.bind(props.keen.addons);
    push(addon("keen:ip_to_geo", { ip: "ip" }, "geo"));
    push(addon("keen:ua_parser", { ua_string: "rawUserAgent" }, "userAgent"));
    return props;
  });

  return Keen;
})());
