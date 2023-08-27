import React from 'react';
import {createRoot} from 'react-dom/client';
import DatasetteVega from './DatasetteVega';

it('renders without crashing', () => {
  const div = document.createElement('div');
  const root = createRoot(div);
  root.render(<DatasetteVega base_url="https://www.example.com/" columns={[]} />);
  root.unmount();
});
