const path = require('node:path');     // for getting directory paths
const fs = require("fs");              // Normal Node.js filesystem
const fsp = require("fs").promises;    // filesystem with better async
const KoaBody = require('koa-body');   // Koa body parser middleware
const { authHelper } = require('../authHelper.js');
const { APP_NAME, STORAGE_PATH } = require('../constants.js');

module.exports = function(router) {

  // -------------------------------------------------
  router.get('/todos', async ctx => {
    const user = authHelper.getLoggedInUser(ctx);
    if (!user) {
      return authHelper.userNotLoggedIn(ctx);
    }

    const fullPath = path.join(STORAGE_PATH, "todos", user.user + '.json');

    // if the given file doesn't exist, return 404
    if (!fs.existsSync(fullPath))
    {
      ctx.res.setHeader("Content-Type", "application/json");
      ctx.res.setHeader("Access-Control-Allow-Origin", "*");
        ctx.body = [];
      ctx.status = 200;
      return;
    }

    const contents = await fsp.readFile(fullPath, 'utf-8');
    const json = JSON.parse(contents);
    ctx.body = json;
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    ctx.response.status = 200;
    console.log(`${APP_NAME}: Requested todos for ${user.user}, returned: ${fullPath}`)
  }); 

  // -------------------------------------------------
  router.post('/todos', KoaBody(), async ctx => {
    const user = authHelper.getLoggedInUser(ctx);
    if (!user) {
      return authHelper.userNotLoggedIn(ctx);
    }

    const fullPath = path.join(STORAGE_PATH, "todos", user.user + '.json');
    const contents = JSON.stringify(ctx.request.body);

    await fsp.writeFile(fullPath, contents);
    ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    ctx.response.status = 200;
    console.log(`${APP_NAME}: Saved todos for ${user.user} to ${fullPath}`);
  });


}