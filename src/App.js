import React, { Component } from 'react';
import vegaEmbed from 'vega-embed';
import './App.css';

const serialize = obj => Object.keys(obj).map(
  key => obj[key] ? `g.${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}` : ''
).join('&');

const unserialize = s => {
  if (s && s[0] === '#') {
    s = s.slice(1);
  }
  if (!s) {
    return {};
  }
  var obj = {};
  s.split('&').forEach(bit => {
    let pair = bit.split('=');
    obj[decodeURIComponent(pair[0]).replace(/^g\./, '')] = decodeURIComponent(pair[1]);
  });
  return obj;
};

class App extends Component {
  state = {
    mark: "bar",
    x_column: this.props.columns[0],
    x_type: "ordinal",
    y_column: this.props.columns[1],
    y_type: "quantitative",
    color_column: "",
    size_column: ""
  }
  markOptions = [
    {"value": "bar", "name": "bar"},
    {"value": "line", "name": "line"},
    {"value": "circle", "name": "circle"},
    {"value": "square", "name": "square"},
    {"value": "point", "name": "point"},
  ]
  typeOptions = [
    {"value": "quantitative", "name": "Numbers (quantitative)"},
    {"value": "quantitative-bin", "name": "Numbers (quantitative), binned"},
    {"value": "temporal", "name": "Dates and times (temporal)"},
    {"value": "temporal-bin", "name": "Dates and times (temporal), binned"},
    {"value": "ordinal", "name": "Labels (ordinal)"},
    {"value": "nominal", "name": "Categories (nominal)"},
  ]
  onChangeSelect(name, ev) {
    ev.persist();
    window.lastEv = ev;
    this.setState({[name]: ev.target.value}, () => {
      this.renderGraph();
    });
  }
  componentDidMount() {
    window.onpopstate = this.onPopStateChange.bind(this);
    this.renderGraph();
  }
  onPopStateChange(ev) {
    window.lastPopEv = ev;
    let expected = '#' + serialize(this.state);
    if (expected !== document.location.hash) {
      this.setState(
        unserialize(document.location.hash), this.renderGraph.bind(this)
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
      y: {field: this.state.y_column, type: y_type, bin: y_bin}
    }
    if (this.state.color_column) {
      encoding.color = {field: this.state.color_column, type: "nominal"};
    }
    if (this.state.size_column) {
      encoding.size = {field: this.state.size_column, type: "quantitative"};
    }
    const spec = {
      data: {
        url: this.props.json_url
      },
      mark: this.state.mark,
      encoding: encoding
    }
    if (spec.mark) {
      vegaEmbed("#vis", spec, {theme: 'quartz', tooltip: true});
      document.location.hash = '#' + serialize(this.state);
      this.setState({spec: spec});
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
  render() {
    const onChangeSelect = this.onChangeSelect.bind(this);
    if (!this.state.mark) {
      return null;
    }
    return (
      <form action="" method="GET" id="graphForm">
        <div>
          Mark: <select name="mark" value={this.state.mark} onChange={ev => onChangeSelect("mark", ev)}>
            {this.markOptions.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
          </select>
        </div>
        <div>
          X column: <select name="x_column" value={this.state.x_column} onChange={ev => onChangeSelect("x_column", ev)}>
            {this.props.columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <div>
          X type: <select name="x_type" value={this.state.x_type} onChange={ev => onChangeSelect("x_type", ev)}>
            {this.typeOptions.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
          </select>
        </div>
        <div>
          Y column: <select name="y_column" value={this.state.y_column} onChange={ev => onChangeSelect("y_column", ev)}>
            {this.props.columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <div>
          Y type: <select name="y_type" value={this.state.y_type} onChange={ev => onChangeSelect("y_type", ev)}>
            {this.typeOptions.map(option => <option key={option.value} value={option.value}>{option.name}</option>)}
          </select>
        </div>
        <div>
          Color column: <select name="color_column" value={this.state.color_column} onChange={ev => onChangeSelect("color_column", ev)}>
            <option value="">-- none --</option>
            {this.props.columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <div>
          Size column: <select name="size_column" value={this.state.size_column} onChange={ev => onChangeSelect("size_column", ev)}>
            <option value="">-- none --</option>
            {this.props.columns.map(column => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <div><button onClick={this.toggleAxis.bind(this)}>Swap X and Y</button></div>
      </form>
    );
  }
}

export default App;
