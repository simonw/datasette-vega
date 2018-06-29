import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DatasetteVega from './DatasetteVega';

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
      let table = document.querySelector('table.rows-and-columns');
      table.parentNode.insertBefore(visTool, table);
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
