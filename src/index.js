import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import DatasetteVega from './DatasetteVega';

ReactDOM.render(
  /*<App columns={[
    'airline',
    'avail_seat_km_per_week',
    'incidents_85_99',
    'fatal_accidents_85_99',
    'fatalities_85_99',
    'incidents_00_1',
    'fatal_accidents_00_14',
    'fatalities_00_14'
  ]}
  json_url="https://fivethirtyeight.datasettes.com/fivethirtyeight-45d758d/bechdel%2Fmovies.json?_shape=array"
  // json_url="https://fivethirtyeight.datasettes.com/fivethirtyeight-45d758d/airline-safety%2Fairline-safety.json?_shape=array"
  */
  <DatasetteVega base_url="https://fivethirtyeight.datasettes.com/fivethirtyeight-45d758d.json?sql=select+rowid%2C+*+from+%5Bbechdel%2Fmovies%5D+order+by+random%28%29+limit+200"
  />, document.getElementById('root')
);
