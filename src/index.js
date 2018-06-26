import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DatasetteVega from './DatasetteVega';

document.addEventListener('DOMContentLoaded', () => {
  const jsonEl = document.querySelector('.export-links a[href*=json]');
  if (jsonEl) {
    // Create elements to inject this into
    let visWrapper = document.createElement('div');
    visWrapper.style.overflow = 'hidden';
    let vis = document.createElement('div');
    let visTool = document.createElement('div');
    vis.setAttribute('id', 'vis');
    visWrapper.appendChild(vis);
    let table = document.querySelector('table.rows-and-columns');
    table.parentNode.insertBefore(visWrapper, table);
    table.parentNode.insertBefore(visTool, visWrapper);
    let jsonUrl = jsonEl.getAttribute('href');
    // Add _shape=array
    jsonUrl += (jsonUrl.indexOf('?') > -1) ? '&' : '?';
    jsonUrl += '_shape=array'
    ReactDOM.render(
      <DatasetteVega base_url={jsonUrl} />, visTool
    );
  }
});
