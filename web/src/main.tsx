import React from "react";
import ReactDOM from "react-dom";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import "./index.css";
import { Provider } from "react-redux";
import App from "./App";
import store from "./app/store";
import { fetchPublicMeditationsThunk } from "./features/meditation/meditationSlice";
import { Auth0Provider, Auth0ProviderOptions } from "@auth0/auth0-react";
import { fetchPublicSequencesThunk } from "./features/sequences/sequenceSlice";

store.dispatch(fetchPublicMeditationsThunk());
store.dispatch(fetchPublicSequencesThunk());

const darkTheme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

const authProps: Auth0ProviderOptions = {
	domain: "equulus.us.auth0.com",
	clientId: "a45HOOQ5VyDf2mf4V0oC5hXXClfjR1P1",
	redirectUri: window.location.origin,
  cacheLocation: "localstorage"
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
