// this script logs in a testuser and prints the JWT to stdout
// it can be used for testing api routes outside the browser
// you must be logged into the crosscut-prod account

const AWS = require("aws-sdk");
const SSM = new AWS.SSM({ region: "us-east-1" });

const Auth = require("aws-amplify").Auth;

Auth.configure({
  Auth: {
    region: "us-east-1",
    userPoolId: "us-east-1_CxDqTBW25",
    userPoolWebClientId: "4fdr5i4299p64k9k29hoi1b5vr",
  },
});

async function getParamStoreValue(paramName) {
  const value = await SSM.getParameter({ Name: paramName }).promise();
  return value.Parameter.Value;
}

async function getEncryptedParamStoreValue(paramName) {
  const value = await SSM.getParameter({
    Name: paramName,
    WithDecryption: true,
  }).promise();
  return value.Parameter.Value;
}

async function signIn() {
  try {
    const username = await getParamStoreValue("/admin/testuser-username");
    const password = await getEncryptedParamStoreValue(
      "/admin/testuser-password"
    );

    const user = await Auth.signIn(username, password);
    if (process.argv.slice(2)[0] === "payload") {
      console.log(user.signInUserSession.idToken.payload);
    } else {
      console.log(user.signInUserSession.idToken.jwtToken);
    }
  } catch (error) {
    console.log("error signing in", error);
  }
}

signIn();
