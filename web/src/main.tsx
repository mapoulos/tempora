import React from "react";
import ReactDOM from "react-dom";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import "./index.css";
import { Provider } from "react-redux";
import App from "./App";
import store from "./app/store";
import { fetchPublicMeditationsThunk } from "./features/meditation/meditationSlice";
// import { fetchPublicMeditations } from './features/meditation/meditationService'

store.dispatch(fetchPublicMeditationsThunk());

const darkTheme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  ,
  document.getElementById("root")
);
