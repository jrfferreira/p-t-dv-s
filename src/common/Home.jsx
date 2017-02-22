import React from 'react'

import { Link } from 'react-router'

export default class MainLayout extends React.Component {
  render() {
    return <div>
              <p>
                Hi! I'm jrfferreira and this is a prototype to help Survival game mode, fell free to send any suggestion to jrfferreira at zoho...
              </p>

              <p>If you want to try, create a session with the following button and share the URL with your teammates.</p>

              <Link to="/new"><button>Create session</button></Link>
          </div>
  }
}
