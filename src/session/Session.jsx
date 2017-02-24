import React, { PropTypes } from 'react'
import {render} from 'react-dom'
import {map, size, get} from 'lodash'
import Peer from 'peerjs'
import { Link, browserHistory } from 'react-router'

import {config} from '../config'

import {Build} from './Build.jsx'

const maxConnections = 4
const connectionStatus = {
  loading: 'LOADING',
  opened: 'OPENED',
  closed: 'CLOSED'
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

          this.peer = new Peer(Object.assign({}, config.peerjs, {config: data.d}))

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
          metadata: {nickname: this.state.nickname }
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
        this.updatePeerState(connection.peer, connection.metadata)

        this.sendUpdate({
          nickname: this.state.nickname,
          build: this.state.peers[this.state.pid].build,
          connectedPeers: this.state.connectedPeers
        })
      })
      connection.on('close', this.onClose(connection.peer))
      connection.on('error', this.onError(connection.peer))
    }
  }

  onError = (peerId) => (error) => {
    console.log('Error:', peerId, error)
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
      hostId,
      connectedPeers: Object.assign({}, this.state.connectedPeers, {
        [pid]: connectionStatus.opened
      }),
      peers: Object.assign({}, this.state.peers, {
        [pid]: Object.assign({}, this.state.peers[pid], {nickname:this.state.nickname, build: null})
      })
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
      nickname,
      peers: Object.assign({}, this.state.peers, {
        [this.state.pid]: Object.assign({}, this.state.peers[this.state.pid], {nickname})
      })
    })
    this.sendUpdate({nickname})
  }

  updatePeerState = (peer, {nickname, build={}}) => {
    this.setState({
      connectedPeers: Object.assign({}, this.state.connectedPeers, {
        [peer]: connectionStatus.opened
      }),
      peers: Object.assign({}, this.state.peers, {
        [peer]: Object.assign({}, this.state.peers[peer], {nickname, build})
      })
    })
  }

  onUpdateBuild = (peerId) => (build) => {
    let peer = Object.assign({}, this.state.peers[peer], {
          nickname: this.state.nickname,
          build:  Object.assign({}, (this.state.peers[peer]||{}).build, build)
        })
    
    console.log('your build',this.state.peers, peerId, peer)

    this.setState({
      peers: Object.assign({}, this.state.peers, {
        [peerId]: peer
      })
    })

    this.sendUpdate(peer)
  }

  render () {
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
                <div>Your Squad: {size(this.state.connectedPeers)}/{maxConnections} players</div>
                {map(this.state.connectedPeers, (nickname, peer) => {
                  return <Build key={peer} status={this.state.connectedPeers[peer]} readOnly={true} {...this.state.peers[peer]}/>
                })}

                {isHost? <div>You are the host <pre>{this.state.pid}</pre></div> : null}

                <label className="nickname">
                  <span className="nickname__label">Your name:</span>
                  <input className="nickname__input" type="text" value={this.state.nickname} onChange={this.onChangeNickname} />
                </label>

                <Build status={this.state.connectedPeers[this.state.pid]} readOnly={false} onUpdateBuild={this.onUpdateBuild(this.state.pid)}  {...this.state.peers[this.state.pid]}/>
              </div>
              :
              <div>loading...</div>
              }
          </div>
  }
}
