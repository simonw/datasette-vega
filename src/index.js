import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DatasetteVega from './DatasetteVega';

document.addEventListener('DOMContentLoaded', () => {
  let visWrapper, vis, visTool, jsonUrl;
  if (process.env.REACT_APP_STAGE === 'dev') {
    // Dev mode - use graph elements already on the index.html page
    let m = /\?url=(.*)/.exec(window.location.search)
    if (m) {
      jsonUrl = decodeURIComponent(m[1]);
      document.getElementById('jsonUrl').value = jsonUrl;
      visWrapper = document.getElementById('vis-wrapper');
      vis = document.getElementById('vis');
      visTool = document.getElementById('vis-tool');
    }
  } else {
    const jsonEl = document.querySelector('.export-links a[href*=json]');
    if (jsonEl) {
      jsonUrl = jsonEl.getAttribute('href');
      // Create elements for adding graph tool to page
      visWrapper = document.createElement('div');
      visWrapper.style.overflow = 'hidden';
      vis = document.createElement('div');
      visTool = document.createElement('div');
      vis.setAttribute('id', 'vis');
      visWrapper.appendChild(vis);
      let table = document.querySelector('table.rows-and-columns');
      table.parentNode.insertBefore(visWrapper, table);
      table.parentNode.insertBefore(visTool, visWrapper);
    }
  }
  if (jsonUrl) {
    // Add _shape=array
    jsonUrl += (jsonUrl.indexOf('?') > -1) ? '&' : '?';
    jsonUrl += '_shape=array'
    ReactDOM.render(
      <DatasetteVega base_url={jsonUrl} />, visTool
    );
  }
});
