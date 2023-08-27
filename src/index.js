import React from 'react';
import {createRoot} from 'react-dom/client';
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
  let jsonEl = document.querySelector('.export-links a[href*=json]');
  if (jsonEl) {
    // If a JSON "export link" exists, infer that we're embedded on a datasette table page (i.e. running as a plugin).
    // Add graph tool DOM elements to the page.
    jsonUrl = jsonEl.getAttribute('href');
    visTool = document.createElement('div');
    let table = document.querySelector('table.rows-and-columns');
    table.parentNode.insertBefore(visTool, table);
  } else {
    // Otherwise, assume we're running in dev mode (i.e. running via npm start), and that graph elements are already on
    // the page.
    let m = /\?url=(.*)/.exec(window.location.search)
    if (m) {
      jsonUrl = decodeURIComponent(m[1]);
      document.getElementById('jsonUrl').value = jsonUrl;
      visTool = document.getElementById('vis-tool');
    }
  }
  if (jsonUrl) {
    // Add _shape=array
    jsonUrl += (jsonUrl.indexOf('?') > -1) ? '&' : '?';
    jsonUrl += '_shape=array'
    let root = createRoot(visTool);
    root.render(
      <DatasetteVega base_url={jsonUrl} onFragmentChange={onFragmentChange} />
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
