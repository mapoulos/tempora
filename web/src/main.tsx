import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { Provider } from 'react-redux'
import App from './App'
import store from './app/store'
import { fetchPublicMeditations } from './features/meditation/meditationService'

const meditations = fetchPublicMeditations()
  .then((meditations) => {
    console.log(meditations)
  })

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
    <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)
