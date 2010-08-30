eo.select = function(e, data) {
  var select = {},
      items;

  // TODO optimize implementation for single-element selections?

  if (arguments.length < 2) data = empty;

  if (typeof e == "string") {
    items = xpath(e, document, []);
  } else if (e instanceof Array) {
    items = e.slice();
  } else {
    items = [e];
  }

  // TODO does it make sense if e is not a string for subselect?

  select.select = function(e) {
    var subitems = [];
    if (data === empty) {
      var subdata = empty;
      for (var i = 0; i < items.length; i++) {
        xpath(e, items[i] || document, subitems);
      }
    } else {
      var subdata = [];
      for (var i = 0, j = 0; i < items.length; i++) {
        xpath(e, items[i] || document, subitems);
        for (var d = data[i]; j < subitems.length; j++) subdata.push(d);
      }
    }
    return eo.select(subitems, subdata);
  };

  select.add = function(n) {
    n = ns.qualify(n);
    var children = [];
    if (n.space) {
      for (var i = 0; i < items.length; i++) {
        children.push(items[i].appendChild(document.createElementNS(n.space, n.local)));
      }
    } else {
      for (var i = 0; i < items.length; i++) {
        children.push(items[i].appendChild(document.createElement(n)));
      }
    }
    return eo.select(children, data);
  };

  select.remove = function() {
    for (var i = 0; i < items.length; i++) {
      var e = items[i];
      if (e.parentNode) e.parentNode.removeChild(e);
    }
    return select;
  };

  // TODO select parent / children (convenience functions, using xpath)?

  // TODO argument to value function should be a selector? Alternatively, the
  // selector could track the index internally, and thus calling attr("opacity")
  // would return the value of the opacity attribute on the active node.

  // Or perhaps there's a way to specify the context for elements, so that by
  // default, there's no argument to the value function? And perhaps the map
  // object can override this context to pass in data?

  select.attr = function(n, v) {
    n = ns.qualify(n);
    if (n.space) {
      if (v == null) {
        for (var i = 0; i < items.length; i++) {
          items[i].removeAttributeNS(n.space, n.local);
        }
      } else if (typeof v == "function") {
        for (var i = 0; i < items.length; i++) {
          var e = items[i],
              x = v.call(select, data[i], i);
          x == null
              ? e.removeAttributeNS(n.space, n.local)
              : e.setAttributeNS(n.space, n.local, x);
        }
      } else {
        for (var i = 0; i < items.length; i++) {
          items[i].setAttributeNS(n.space, n.local, v);
        }
      }
    } else if (v == null) {
      for (var i = 0; i < items.length; i++) {
        items[i].removeAttribute(n);
      }
    } else if (typeof v == "function") {
      for (var i = 0; i < items.length; i++) {
        var e = items[i],
            x = v.call(select, data[i], i);
        x == null
            ? e.removeAttribute(n)
            : e.setAttribute(n, x);
      }
    } else {
      for (var i = 0; i < items.length; i++) {
        items[i].setAttribute(n, v);
      }
    }
    return select;
  };

  select.style = function(n, v, p) {
    if (arguments.length < 3) p = null;
    if (v == null) {
      for (var i = 0; i < items.length; i++) {
        items[i].style.removeProperty(n);
      }
    } else if (typeof v == "function") {
      for (var i = 0; i < items.length; i++) {
        var e = items[i],
            x = v.call(select, data[i], i);
        x == null
            ? e.style.removeProperty(n)
            : e.style.setProperty(n, x, p);
      }
    } else {
      for (var i = 0; i < items.length; i++) {
        items[i].style.setProperty(n, v, p);
      }
    }
    return select;
  };

  // TODO text assumes that there is exactly 1 text node chlid

  select.text = function(v) {
    if (v == null) {
      for (var i = 0; i < items.length; i++) {
        var e = items[i];
        if (e.firstChild) e.removeChild(e.firstChild);
      }
    } else if (typeof v == "function") {
      for (var i = 0; i < items.length; i++) {
        var e = items[i],
            x = v.call(select, data[i], i);
        if (x == null) {
          if (e.firstChild) e.removeChlid(e.firstChild);
        } else {
          if (e.firstChild) e.firstChild.nodeValue = x;
          else e.appendChild(document.createTextNode(x));
        }
      }
    } else {
      for (var i = 0; i < items.length; i++) {
        var e = items[i];
        if (e.firstChild) e.firstChild.nodeValue = v;
        else e.appendChild(document.createTextNode(v));
      }
    }
    return select;
  };

  select.length = function() {
    return items.length;
  };

  select.item = function(i) {
    return items[i];
  };

  // TODO does it make sense to expose this datum method publicly?
  // It'd be nice if we could somehow hide it inside the `map` object.

  select.datum = function(i) {
    return data[i];
  };

  select.transition = function() {
    return eo_transition(select);
  };

  return select;
};

function xpath(e, c, items) {
  var item,
      results = document.evaluate(
      e, // XPath expression
      c, // context node
      ns.resolve, // namespace resolver
      XPathResult.UNORDERED_NODE_ITERATOR_TYPE, // result type
      null); // result object
  while ((item = results.iterateNext()) != null) items.push(item);
  return items;
}

var empty = {};
