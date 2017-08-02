import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>react-playground</h2>
        </div>
        <p className="App-intro">
          Oh snap! You found my ReactJS test page. Nothing much to see here...
        </p>
      </div>
    );
  }
}

export default App;
