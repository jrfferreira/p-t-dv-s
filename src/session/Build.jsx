import React, {PropTypes} from 'react'

import classnames from 'classnames'

const status = ['empty', 'standard', 'specialized', 'superior', 'high-end']

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

class BooleanBuildIteraction extends React.Component {  
  
  props: {
    onUpdateBuild: PropTypes.Function,
    label: PropTypes.String,
    type: PropTypes.String,
    value: PropTypes.Number,
    className: PropTypes.String,
  }

  onClick = (e) => {
    e.preventDefault()
    let nextValue = this.props.value ? 0 : 1
    this.props.onUpdateBuild(this.props.type, nextValue)
  }

  getStatus = (val) => {
    return val ? 'active' : 'inactive'
  }

  getClasses = () => {
    let pieceClass = 'build__action'
    let pieceType = `${pieceClass}__${this.props.type}`
    let pieceWithStatus = `${pieceType}--${this.getStatus(this.props.value)}`
    return classnames([this.props.className, pieceClass, pieceType, pieceWithStatus])
  }

  render() {
    return <div className={this.getClasses()} onClick={this.props.onUpdateBuild ? this.onClick : null}>
              {this.props.label}
            </div>
  }
}

class CiclicBuildPiece extends React.Component {  
  
  props: {
    onUpdateBuild: PropTypes.Function,
    type: PropTypes.String,
    value: PropTypes.Number,
    className: PropTypes.String,
  }

  onClick = (e) => {
    e.preventDefault()
    let nextValue = this.props.value + 1
    
    if(!status[nextValue]) {
      nextValue = defaultPeerState[this.props.type]
    }
    this.props.onUpdateBuild(this.props.type, nextValue)
  }

  getStatus = (val) => {
    return status[val]||status[0]
  }

  getClasses = () => {
    let pieceClass = 'build__piece'
    let pieceType = `${pieceClass}__${this.props.type}`
    let pieceWithStatus = `${pieceType}--${this.getStatus(this.props.value)}`
    return classnames([this.props.className, pieceClass, pieceType, pieceWithStatus])
  }

  render() {
    return <div className={this.getClasses()} onClick={this.props.onUpdateBuild ? this.onClick : null}>
              {this.props.type}
            </div>
  }
}

export class Build extends React.Component {
  
  state: {
    build: PropTypes.Object,
  }

  props: {
    readOnly: PropTypes.Boolean.isRequired,
    onUpdateBuild: PropTypes.Function,
    peer: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      build:  Object.assign({}, defaultPeerState, props.build)
    }
  }

  componentWillReceiveProps(np) {
    this.updateBuild(np.build)
  }

  updateBuild(build={}){
    this.setState({
      build: Object.assign({}, this.state.build, build)
    })
  }

  onUpdateBuild = (piece, value) => {
    this.props.onUpdateBuild(Object.assign({}, this.state.build, {
      [piece]: value
    }))
  }

  render() {
    return <div className={classnames({"build":true, "build--expectator": this.props.readOnly})}>
            <div className="build__header">
              { this.props.readOnly ? 
                `${this.props.nickname}: ${this.props.status}`
                :
                'Your build' 
              }
            </div>
            <div className="build__set">
              <div className="build__column">
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="w1" value={this.state.build.w1}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="w2" value={this.state.build.w2}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="w3" value={this.state.build.w3}/>
              </div>
              <div className="build__column">
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="c" value={this.state.build.c}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="m" value={this.state.build.m}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="k" value={this.state.build.k}/>
              </div>
              <div className="build__column">
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="b" value={this.state.build.b}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="g" value={this.state.build.g}/>
                <CiclicBuildPiece onUpdateBuild={this.onUpdateBuild} type="h" value={this.state.build.h}/>
              </div>
            </div>
            <div className="build__state">
                <BooleanBuildIteraction onUpdateBuild={this.onUpdateBuild} label="need medicine" type="nm" value={this.state.build.nm}/>
                <BooleanBuildIteraction onUpdateBuild={this.onUpdateBuild} label="ready to DZ" type="dz" value={this.state.build.dz}/>
                <BooleanBuildIteraction onUpdateBuild={this.onUpdateBuild} label="ready to extract" type="xt" value={this.state.build.xt}/>
            </div>
          </div>
  }
}
