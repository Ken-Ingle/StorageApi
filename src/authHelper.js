const { v4: uuidv4 } = require('uuid');

let loggedInUsers = [];
const AUTH_ENABLED = process.env.AUTH_ENABLED === "1";

// -----------------------------------------------------
function addLoggedInUser(userName) {
  const user = loggedInUsers.filter(u => u.user !== userName);
  if (!user || user.length === 0) {
    const auth_token = `${uuidv4()}-${uuidv4()}`;
    loggedInUsers.push({
      user: userName,
      auth_token
    });
    return auth_token;
  } else {
    return user[0].auth_token;
  }
}

// -----------------------------------------------------
function removeLoggedInUser(auth_token) {
  const user = loggedInUsers.filter(u => u.auth_token === auth_token);
  if (!user || user.length === 0) {
    return false;
  }

  loggedInUsers = loggedInUsers.filter(u => u.auth_token !== auth_token);
  return true;
}

// -----------------------------------------------------
function getLoggedInUser(ctx) {
  if (!ctx.request.header.authorization) {
    if (AUTH_ENABLED) {
      return null;
    } else {
      return {
        user: "UNKNOWN_USER",
        auth_token: null
      }
    }
  }

  const auth_token = ctx.request.header.authorization;
  const user = loggedInUsers.filter(u => u.auth_token === auth_token);
  if (!user || user.length === 0) {
    return null;
  }

  return user[0];  
}

// -----------------------------------------------------
function userNotLoggedIn(ctx) {
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.status = 401;  
}


exports.authHelper = {
  addLoggedInUser,
  removeLoggedInUser,
  getLoggedInUser,
  userNotLoggedIn
}

exports.AUTH_ENABLED = AUTH_ENABLED;