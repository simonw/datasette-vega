import React, { Component } from 'react';
import vegaEmbed from 'vega-embed';
import './DatasetteVega.css';

const serialize = (obj, prefix) => Object.keys(obj).filter(key => obj[key]).map(
  key => `${prefix}.${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
).join('&');

const unserialize = (s, prefix) => {
  if (s && s[0] === '#') {
    s = s.slice(1);
  }
  if (!s) {
    return {};
  }
  var obj = {};
  s.split('&').filter(bit => bit.slice(0, prefix.length + 1) === `${prefix}.`).forEach(bit => {
    let pair = bit.split('=');
    obj[decodeURIComponent(pair[0]).replace(new RegExp(`^${prefix}\\.`), '')] = decodeURIComponent(pair[1]);
  });
  return obj;
};

const escapeString = s => (s || '').replace(/"/g, '\\x22').replace(/'/g, '\\x27');

class DatasetteVega extends Component {
  state = {
    show: false,
    columns: [],
    mark: null,
    x_column: null,
    x_type: "ordinal",
    y_column: null,
    y_type: "quantitative",
    color_column: "",
    size_column: ""
  }
  constructor(props) {
    super(props);
    this.chartRef = React.createRef();
  }
  markOptions = [
    {"value": "bar", "name": "Bar"},
    {"value": "line", "name": "Line"},
    {"value": "circle", "name": "Scatter"},
  ]
  typeOptions = [
    {"value": "quantitative", "name": "Numeric"},
    {"value": "quantitative-bin", "name": "Numeric, binned"},
    {"value": "temporal", "name": "Date/time"},
    {"value": "temporal-bin", "name": "Date/time, binned"},
    {"value": "ordinal", "name": "Label"},
    {"value": "nominal", "name": "Category"},
  ]
  onChangeSelect(name, ev) {
    ev.persist();
    window.lastEv = ev;
    this.setState({[name]: ev.target.value}, () => {
      this.renderGraph();
    });
  }
  jsonUrl() {
    let url = this.props.base_url;
    if (/\?/.exec(url)) {
      url += '&';
    } else {
      url += '?';
    }
    url += '_shape=array';
    return url;
  }
  componentDidMount() {
    window.onpopstate = this.onPopStateChange.bind(this);
    // Load the columns
    let url = this.jsonUrl();
    fetch(url).then(r => r.json()).then(data => {
      if (data.length > 1) {
        // Set columns to first item's keys
        const columns = Object.keys(data[0]).map(key => {
          // Do ANY of these rows have a .label property?
          if (data.filter(d => (d[key] || '').label !== undefined).length) {
            return `${key}.label`;
          } else {
            return key;
          }
        });
        let initialState = {
          columns: columns,
          x_column: columns[0],
          y_column: columns[1],
        };
        // Is there state in the URL? If so use that too
        let urlState = unserialize(document.location.hash, 'g');
        if (Object.keys(urlState).length) {
          initialState = Object.assign(initialState, urlState);
          // And show the widget
          initialState.show = true;
        }
        this.setState(initialState, () => {
          this.onPopStateChange();
          this.renderGraph();
        });
      }
    });
  }
  serializeState() {
    return serialize((({
      mark,
      x_column,
      x_type,
      y_column,
      y_type,
      color_column,
      size_column
   }) => ({
      mark,
      x_column,
      x_type,
      y_column,
      y_type,
      color_column,
      size_column
    }))(this.state), 'g');
  }
  onPopStateChange(ev) {
    window.lastPopEv = ev;
    const expected = '#' + this.serializeState();
    if (expected !== document.location.hash && this.state.mark) {
      this.setState(
        unserialize(document.location.hash, 'g'), this.renderGraph.bind(this)
      );
    }
  }
  renderGraph() {
    const x_type = this.state.x_type.split('-bin')[0];
    const y_type = this.state.y_type.split('-bin')[0];
    const x_bin = !!/-bin$/.exec(this.state.x_type);
    const y_bin = !!/-bin$/.exec(this.state.y_type);
    let encoding = {
      x: {field: this.state.x_column, type: x_type, bin: x_bin},
      y: {field: this.state.y_column, type: y_type, bin: y_bin},
      tooltip: {field: "_tooltip_summary", type: "ordinal"},
    }
    if (this.state.color_column) {
      encoding.color = {field: this.state.color_column, type: "nominal"};
    }
    if (this.state.size_column) {
      encoding.size = {field: this.state.size_column, type: "quantitative"};
    }
    const spec = {
      data: {
        url: this.jsonUrl()
      },
      transform: [{
        calculate: `
          '${escapeString(this.state.x_column)}: ' + datum['${escapeString(this.state.x_column)}'] +
          ', ${escapeString(this.state.y_column)}: ' + datum['${escapeString(this.state.y_column)}'] +
          (${!!this.state.color_column} ? ', ${escapeString(this.state.color_column)}: ' + datum['${escapeString(this.state.color_column)}'] : '') +
          (${!!this.state.size_column} ? ', ${escapeString(this.state.size_column)}: ' + datum['${escapeString(this.state.size_column)}'] : '')
        `,
        as: "_tooltip_summary"
      }],
      mark: this.state.mark,
      encoding: encoding
    }
    if (spec.mark && spec.encoding.x.field && spec.encoding.y.field) {
      vegaEmbed(this.chartRef.current, spec, {theme: 'quartz', tooltip: true});
      document.location.hash = '#' + this.serializeState();
      this.props.onFragmentChange && this.props.onFragmentChange();
      // Add to state so react debug tools can see it (for debugging):
      this.setState({spec: spec, show: true});
    }
  }
  toggleAxis(ev) {
    ev.preventDefault();
    this.setState(prevState => ({
      x_column: prevState.y_column,
      y_column: prevState.x_column,
      x_type: prevState.y_type,
      y_type: prevState.x_type,
    }), this.renderGraph);
  }
  showChart() {
    this.setState({
      show: true
    }, this.renderGraph.bind(this));
  }
  hideChart() {
    this.setState({
      show: false
    }, this.renderGraph.bind(this));
  }
  render() {
    const onChangeSelect = this.onChangeSelect.bind(this);
    const columns = this.state.columns;
    if (!this.state.show) {
      return <div className="datasette-vega-inactive"><button onClick={this.showChart.bind(this)}>Show charting options</button></div>;
    }
    return (
      (columns.length > 1) ? <div>
        <div className="datasette-vega-inactive"><button onClick={this.hideChart.bind(this)}>Hide chart</button></div>
        <form action="" method="GET" id="graphForm" className="datasette-vega">
        <h3>Charting options</h3>
        <div className="filter-row radio-buttons">
          {this.markOptions.map(option => (
            <label key={option.value} value={option.value}><input
              type="radio"
              name="mark"
              value={option.value}
              checked={option.value === this.state.mark}
              onChange={ev => onChangeSelect("mark", ev)}
            /> {option.name}</label>
          ))}
        </div>
        <div className="filter-row">
          <label>X column <div className="select-wrapper"><select name="x_column" value={this.state.x_column || ''} onChange={ev => onChangeSelect("x_column", ev)}>
            {columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select></div></label>
          <label>Type <div className="select-wrapper"><select name="x_type" value={this.state.x_type} onChange={ev => onChangeSelect("x_type", ev)}>
            {this.typeOptions.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
          </select></div></label>
        </div>
        <div className="filter-row">
          <label>Y column <div className="select-wrapper"><select name="y_column" value={this.state.y_column || ''} onChange={ev => onChangeSelect("y_column", ev)}>
            {columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select></div></label>
          <label>Type <div className="select-wrapper"><select name="y_type" value={this.state.y_type} onChange={ev => onChangeSelect("y_type", ev)}>
            {this.typeOptions.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
          </select></div></label>
        </div>
        <div className="swap-x-y">
          <button onClick={this.toggleAxis.bind(this)}>Swap X and Y</button>
        </div>
        <div className="filter-row">
          <label>Color <div className="select-wrapper"><select name="color_column" value={this.state.color_column} onChange={ev => onChangeSelect("color_column", ev)}>
            <option value="">-- none --</option>
            {columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select></div></label>
          <label>Size <div className="select-wrapper"><select name="size_column" value={this.state.size_column} onChange={ev => onChangeSelect("size_column", ev)}>
            <option value="">-- none --</option>
            {columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select></div></label>
        </div>
      </form>
      <div style={{overflow:'auto'}}>
        <div ref={this.chartRef}></div>
      </div>
      </div> : null
    );
  }
}

export default DatasetteVega;
