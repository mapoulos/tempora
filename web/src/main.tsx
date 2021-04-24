import React from "react";
import ReactDOM from "react-dom";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import "./index.css";
import { Provider } from "react-redux";
import App from "./App";
import store from "./app/store";
// import {Auth} from '@aws-amplify/auth'
import { fetchPublicMeditationsThunk } from "./features/meditation/meditationSlice";
import { Auth0Provider } from "@auth0/auth0-react";
// import { fetchPublicMeditations } from './features/meditation/meditationService'

store.dispatch(fetchPublicMeditationsThunk());

const darkTheme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

const authProps = {
	domain: "equulus.us.auth0.com",
	clientId: "a45HOOQ5VyDf2mf4V0oC5hXXClfjR1P1",
	redirectUri: window.location.origin
}


ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Auth0Provider {...authProps}>
        <App />
        </Auth0Provider>
      </ThemeProvider>
    </Provider>
  ,
  document.getElementById("root")
);
