import React, { PropTypes } from 'react'
import {render} from 'react-dom'

import MainLayout from './common/MainLayout.jsx'
import Home from './common/Home.jsx'
import Session from './session/Session.jsx'

import { Router, Route, IndexRoute, browserHistory } from 'react-router'

render((
  <Router history={browserHistory}>
    <Route path="/" component={MainLayout}>
      <IndexRoute component={Home} />
      <Route path="/new" component={Session} />
      <Route path="/session/:hostId" component={Session} />
    </Route>
  </Router>
), document.getElementById('root'));
