import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DatasetteVega from './DatasetteVega';

const matchesCurrentHostAndPath = (url) => {
  // Given a url, is it the same host and path as current page?
  // (ignores querystring and fragment hash)
  url = url.split('#')[0];
  // Only activate if link is to current page (presumably with different querystring)
  var currentHostAndPath = window.location.hostname;
  if (window.location.port !== '') {
    currentHostAndPath += ':' + window.location.port;
  }
  currentHostAndPath += window.location.pathname;
  // Ignore http/s due to https://github.com/simonw/datasette/issues/333
  var linkedHostAndPath = url.split('://')[1].split('?')[0];
  return currentHostAndPath === linkedHostAndPath;
};

// Update any forms with current page as action when fragment changes
const onFragmentChange = () => {
  if (window.location.hash.length === 0) {
    return;
  }
  Array.from(document.getElementsByTagName('form')).forEach(form => {
    var action = form.action.split('#')[0];
    if (matchesCurrentHostAndPath(action)) {
      form.action = action + window.location.hash;
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  let visTool, jsonUrl;
  if (process.env.REACT_APP_STAGE === 'dev') {
    // Dev mode - use graph elements already on the index.html page
    let m = /\?url=(.*)/.exec(window.location.search)
    if (m) {
      jsonUrl = decodeURIComponent(m[1]);
      document.getElementById('jsonUrl').value = jsonUrl;
      visTool = document.getElementById('vis-tool');
    }
  } else {
    const jsonEl = document.querySelector('.export-links a[href*=json]');
    if (jsonEl) {
      jsonUrl = jsonEl.getAttribute('href');
      // Create elements for adding graph tool to page
      visTool = document.createElement('div');
      const container = window.DATASETTE_VEGA_CONTAINER;
      if (container && document.querySelector(container)) {
          document.querySelector(container).appendChild(visTool);
      } else {
          let table = document.querySelector('table.rows-and-columns');
          table.parentNode.insertBefore(visTool, table);
      }
    }
  }
  if (jsonUrl) {
    // Add _shape=array
    jsonUrl += (jsonUrl.indexOf('?') > -1) ? '&' : '?';
    jsonUrl += '_shape=array'
    ReactDOM.render(
      <DatasetteVega base_url={jsonUrl} onFragmentChange={onFragmentChange} />, visTool
    );
  }
});

// Persist #settings across links to same page
window.addEventListener('click', function (ev) {
  if (window.location.hash.length === 0) {
    return true;
  }
  if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.defaultPrevented) {
    return true;
  }
  var a = null;
  for (var n = ev.target; n.parentNode; n = n.parentNode) {
    if (n.nodeName === 'A') {
      a = n;
      break;
    }
  }
  if (!a || !a.href) {
    return true;
  }
  // This expands the full URL even if the link is /relative:
  var href = a.href;
  // Split off any existing #fragment
  href = href.split('#')[0];
  var linkedHostQuery = href.split('?')[1];
  if (matchesCurrentHostAndPath(href)) {
    // Cancel click, navigate to this + fragment instead
    var linkedHostAndPath = href.split('://')[1].split('?')[0];
    if (linkedHostQuery) {
      linkedHostAndPath += '?' + linkedHostQuery;
    }
    ev.preventDefault();
    window.location = window.location.protocol + '//' + linkedHostAndPath + window.location.hash;
    return false;
  }
  return true;
});
