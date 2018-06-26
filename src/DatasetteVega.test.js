import React from 'react';
import ReactDOM from 'react-dom';
import DatasetteVega from './DatasetteVega';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<DatasetteVega base_url="https://www.example.com/" columns={[]} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
