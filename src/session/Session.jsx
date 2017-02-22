import React, { PropTypes } from 'react'
import {render} from 'react-dom'
import {map, size, get} from 'lodash'
import Peer from 'peerjs'
import { Link, browserHistory } from 'react-router'

import {config} from '../config'


const connectionStatus = {
  loading: 'LOADING',
  opened: 'OPENED',
  closed: 'CLOSED'
}

const types = [null, 'green', 'blue', 'purple', 'gold']

const defaultPeerState = {
  w1: 0, // weapon 1
  w2: 0, // weapon 2
  w3: 1, // weapon 3
  c: 1, // chest
  b: 1, // backpack
  m: 1, // mask
  g: 1, // gloves
  k: 1, // kneepad
  h: 1, // hoster
  nm: 0,
  dz: 0,
  xt: 0
}

class Build extends React.Component {
  
  props: {
    peer: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
  }
  render() {
    console.log(this.props)
    return <div>{this.props.nickname}: {this.props.status} </div>
  }
}

export default class Session extends React.Component {
  state: {
    peers: PropTypes.object,
    connectedPeers: PropTypes.object,
    nickname: PropTypes.string,
    hostId: PropTypes.string,
    pid: PropTypes.string
  }

  constructor(props) {
    super(props)

    this.state = {
      peers: {},
      connectedPeers: {},
      nickname: 'player',
      hostId: this.props.params.hostId||'',
      pid: null
    }

    var xhr = new XMLHttpRequest()
    xhr.open('GET', config.xirsysUrl)
    xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          console.log(xhr.responseText, data)

          this.peer = new Peer(Object.assign({}, config.peerjs, {customConfig: data.d}))

          this.peer.on('open', this.onOpen)
          this.peer.on('connection', this.onReceivePeerConnection)
          this.peer.on('error', this.onError())

        }
    };
    xhr.send()
  }

  // Connection handler
  updatePeerConnectionStatus = (peer, status) => {
    this.setState({
      connectedPeers: Object.assign({}, this.state.connectedPeers, {
        [peer]: status
      })
    })
  }

  onClickConnect = (e) => {
      e.preventDefault()
      var requestedPeer = this.state.hostId;
      this.connectToPeer(requestedPeer)
  }
  
  connectToPeer = (requestedPeer) => {
      if ((!this.state.connectedPeers[requestedPeer] || !this.state.connectedPeers[requestedPeer] === connectionStatus.closed) && requestedPeer !== this.state.pid) {

        this.updatePeerConnectionStatus(requestedPeer, connectionStatus.loading)

        var c = this.peer.connect(requestedPeer, {
          label: 'default',
          serialization: 'none',
          metadata: {nickname: this.state.nickname}
        })

        if(c) {
          c.on('open', this.onReceivePeerConnection)
          c.on('data', this.onReceiveData(requestedPeer))
          c.on('error', this.onError(requestedPeer))
          c.on('close', this.onClose(requestedPeer))
        }
      }
  }

  onReceivePeerConnection = (connection) => {
    // Handle a chat connection.
    
    if(connection) {
      this.updatePeerConnectionStatus(connection.peer, connectionStatus.loading)

      // if(size(this.state.connectedPeers) >= 3) {
      //   this.onClose(connection.peer)()
      // }

      connection.on('data', this.onReceiveData(connection.peer))
      connection.on('open', () => {
        this.updatePeerState(connection.peer, {nickname: this.state.nickname })

        this.sendUpdate({
          nickname: this.state.nickname,
          connectedPeers: this.state.connectedPeers
        })
      })
      connection.on('close', this.onClose(connection.peer))
      connection.on('error', this.onError(connection.peer))
    }
  }

  onError = (peerId) => (error) => {
    console.log(peerId, error)
    if (peerId) {
      this.onClose(peerId)()
    }
    this.setState({
      error
    })
  }

  onOpen = (pid) => {
    let hostId = this.state.hostId || pid

    if(this.state.hostId) {
        this.connectToPeer(this.state.hostId)
    } else {
        browserHistory.push('/session/'+pid)
    }

    this.setState({
      pid,
      hostId
    })
  }

  onDelete = (peer) => {
    const connectedPeers = Object.assign({}, this.state.connectedPeers)
    delete connectedPeers[peer]
    this.setState({
      connectedPeers
    })
    this.sendUpdate({connectedPeers})
  }

  onClose = (peer) => () => {
    this.updatePeerConnectionStatus(peer, connectionStatus.closed)
    this.onDelete(peer)
  }

  // Data manipulation

  onReceiveData = (peer) => (data) => {
    const parsedData = JSON.parse(data)
    console.log('receiving message', parsedData)

    if(parsedData.build || parsedData.nickname) {
      this.updatePeerState(peer, parsedData)
    }

    if(parsedData.connectedPeers) {
      map(parsedData.connectedPeers, (status, peer) => {
        this.connectToPeer(peer)
      })
    }
  }

  // Communication handler

  broadcast = (callback) => {
    map(this.state.connectedPeers, (con, peerId) => {
      const connections = this.peer.connections[peerId];
      map(connections, callback)
    })
  }
  
  sendUpdate = (json) => {
    let update = JSON.stringify(json)
    console.log('sending message', json)
    this.broadcast((c) => {
      c.send(update)
    })
  }

  // actions
  onChangeNickname = (e) => {
    let nickname = e.target.value
    this.setState({
      nickname
    })
    this.sendUpdate({nickname})
  }

  updatePeerState = (peer, {nickname, build}) => {
    
    this.setState({
      connectedPeers: Object.assign({}, this.state.connectedPeers, {
        [peer]: connectionStatus.opened
      }),
      peers: Object.assign({}, this.state.peers, {
        [peer]: Object.assign(defaultPeerState, this.state.peers[peer], {nickname, build})
      })
    })
  }

  render () {
    console.log(this.state.hostId)
    let isHost = this.state.hostId === this.state.pid
    let hasError = this.state.error ? this.state.error : false

    if(hasError.type === 'peer-unavailable') {
        browserHistory.push('/?error='+hasError.message)
    }

    return <div>
              {hasError ? 
                <div>
                  <p>[{hasError.type}]: Sorry, you're unable to connect</p>
                  
                  <Link to="/new"><button>Create new session</button></Link>
                </div>
                :
                null
              }
              {this.state.pid ? 
                <div>
                  {isHost? <div>You are the host <pre>{this.state.pid}</pre></div> : null}

                  <label>
                    Your nickname:
                    <input type="text" value={this.state.nickname} onChange={this.onChangeNickname} />
                  </label>


                <ul>
                  {map(this.state.connectedPeers, (nickname, peer) => {
                    return <li key={peer}><Build status={this.state.connectedPeers[peer]} {...this.state.peers[peer]}/></li>
                  })}
                </ul>
              </div>
              :
              <div>loading...</div>

              }
          </div>
  }
}
