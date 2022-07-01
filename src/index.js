const Koa = require('koa');            // Koa: newer, better express.js
const KoaCors = require('@koa/cors');
const Router = require('koa-router');  // Router for Koa
const  routesAuth  = require("./routes/routesAuth.js");
const  routesTodos  = require("./routes/routesTodos.js");
const  routesFiles  = require("./routes/routesFiles");
const  routesWeb  = require("./routes/routesWeb.js");
const { AUTH_ENABLED } = require('./authHelper.js');
const { APP_NAME, PORT, STORAGE_PATH } = require('./constants.js');

// Instantiate our new app and router with routes
const app = new Koa();
const router = new Router();
routesAuth(router);    //   /auth and /logout
routesTodos(router);   //   /todos POST and GET
routesFiles(router);   //   /folder/file routes
routesWeb(router);     //   web UI routes

app
  .use(KoaCors())
  .use(router.allowedMethods())
  .use(router.routes())
  .listen(PORT);

console.log(`${APP_NAME}: AUTH_ENABLED: ${(AUTH_ENABLED) ? "YES" : "NO"}`);
console.log(`${APP_NAME}: Listening on port ${PORT}, files will be stored under ${STORAGE_PATH}`);
