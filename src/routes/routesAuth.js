const path = require('node:path');     // for getting directory paths
const fs = require("fs");              // Normal Node.js filesystem
const fsp = require("fs").promises;    // filesystem with better async
const KoaBody = require('koa-body');   // Koa body parser middleware
const { authHelper } = require('../authHelper.js');
const { APP_NAME, STORAGE_PATH } = require('../constants.js');

module.exports = function(router) {

  // -----------------------------------------------------
  router.post('/logout', async ctx => {
    if (ctx.request.header.authorization) {
      if (authHelper.removeLoggedInUser(ctx.request.header.authorization)) {
        console.log(`${APP_NAME}: Logout: User logged out`);
        ctx.status = 200;
      } else {
        console.log(`${APP_NAME}: Logout: Bad request, auth_token not found or other issue`);
        ctx.status = 400;
      }
    }
  });

  // -----------------------------------------------------
  router.post('/auth', KoaBody(), async ctx => {
    const body = ctx.request.body;
    const user = body.user;
    const password = body.password;

    const folderPath = path.join(STORAGE_PATH, "auth");
    const userFile = path.join(folderPath, user + ".json");
    ctx.res.setHeader("Access-Control-Allow-Origin", "*");

    if (!fs.existsSync(userFile)) {
      ctx.response.status = 401;
      ctx.body = {
        auth: false,
        message: "User not found",
        auth_token: null
      }

      console.log(`${APP_NAME}: AUTH: User '${user}' not found (no file, ${userFile})`)
      return;
    }

    const contents = await fsp.readFile(userFile, 'utf-8');
    const json = JSON.parse(contents);
    if (json.password === password) {
      let auth_token = authHelper.addLoggedInUser(user);
      ctx.response.status = 200;
      ctx.body = {
        auth: true,
        message: "Logged in",
        auth_token
      }

      console.log(`${APP_NAME}: AUTH: User '${user}' logged in, auth_token: ${auth_token}`)
      return;
    }

    ctx.response.status = 401;
    ctx.body = {
      auth: false,
      message: "Invalid password",
      auth_token: null
    };

    console.log(`${APP_NAME}: AUTH: Invalid password for '${user}'`);   
  });
}


