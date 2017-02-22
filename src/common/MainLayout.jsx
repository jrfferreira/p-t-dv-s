import React from 'react'

import {Menu, MenuItem} from 'react-foundation'

import '../scss/layout.scss'

export default class MainLayout extends React.Component {
  render() {
    return <div className="app-container">
              <header><h1>p2p</h1>{ this.props.params.hostId ? <button>share session</button> : null}</header>
                {this.props.children}
              <footer>jrfferreira - 2017</footer>
           </div>
  }
}
