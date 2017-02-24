import React from 'react'

import {Menu, MenuItem} from 'react-foundation'

import '../scss/layout.scss'

export default class MainLayout extends React.Component {
  render() {
    return <div className="app-container">
              <header  className="app-container__header"><h1>p2p { this.props.params.hostId ? <span> session: <code>{this.props.params.hostId}</code></span> : null}</h1></header>
              <div className="app-container__body">{this.props.children}</div>
              <footer className="app-container__footer">jrfferreira - 2017</footer>
           </div>
  }
}
