const Koa = require('koa');            // Koa: newer, better express.js
const KoaBody = require('koa-body');   // Koa body parser middleware
const KoaCors = require('@koa/cors');
const Router = require('koa-router');  // Router for Koa
const fs = require("fs");              // Normal Node.js filesystem
const fsp = require("fs").promises;    // filesystem with better async
const path = require('node:path');     // for getting directory paths
const { v4: uuidv4 } = require('uuid');
const { request } = require('http');

const AUTH_ENABLED = false;
const PORT = 3000;  // default port we'll listen on
const STORAGE_PATH = path.join(__dirname, 'storage');
const APP_NAME = "STORAGE-API";  // just used for logging

// Instantiate our new app and router
const app = new Koa();
const router = new Router();

let loggedInUsers = [];

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

// -----------------------------------------------------
router.post('/logout', async ctx => {
  if (ctx.request.header.authorization) {
    const result = removeLoggedInUser(ctx.request.header.authorization);
    if (result) {
      ctx.status = 200;
    } else {
      ctx.status = 404;
    }
  }

  ctx.status = 400;
});

// -----------------------------------------------------
router.post('/auth', KoaBody(), async ctx => {
  const body = ctx.request.body;
  const user = body.user;
  const password = body.password;

  const folderPath = path.join(STORAGE_PATH, "auth");
  const userFile = path.join(folderPath, user + ".json");
  console.log("trying to read " + userFile);
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");

  if (!fs.existsSync(userFile)) {
    ctx.response.status = 401;
    ctx.body = {
      auth: false,
      message: "User not found",
      auth_token: null
    }

    return;
  }

  const contents = await fsp.readFile(userFile, 'utf-8');
  const json = JSON.parse(contents);
  if (json.password === password) {
    ctx.response.status = 200;
    ctx.body = {
      auth: true,
      message: "Logged in",
      auth_token: addLoggedInUser(user)
    }

    return;
  }

  ctx.response.status = 401;
  ctx.body = {
    auth: false,
    message: "Invalid password",
    auth_token: null
  };
});

// -------------------------------------------------
router.get('/todos', async ctx => {
  const user = getLoggedInUser(ctx);
  if (!user) {
    return userNotLoggedIn(ctx);
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
  const user = getLoggedInUser(ctx);
  if (!user) {
    return userNotLoggedIn(ctx);
  }

  const fullPath = path.join(STORAGE_PATH, "todos", user.user + '.json');
  const contents = JSON.stringify(ctx.request.body);

  await fsp.writeFile(fullPath, contents);
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Saved todos for ${user.user} to ${fullPath}`);
});


// -------------------------------------------------
router.get('/', ctx => {
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.body = `
      <html>
        <head>
          <title>${APP_NAME}</title>
        </head>
        <body style='font-family: Verdana,sans-serif;'>
          <h2>
            ${APP_NAME}
          </h2>
          <i>For development &amp; educational purposes only.<i>
        </body>
      </html>
  `;
  ctx.response.status = 200;
});

// -------------------------------------------------
// Given a folder, list out the json files in that folder,
// returning as an array object
router.get('/:folder', async ctx => {
  // Get our folder from the parameters, first part of URL
  const folder = ctx.params.folder;
  const fullPath = path.join(STORAGE_PATH, folder);

  if (!getLoggedInUser(ctx)) {
    return userNotLoggedIn(ctx);
  }
  
  // if the given path doesn't exist, return 404
  if (!fs.existsSync(fullPath))
  {
    console.error(`${APP_NAME}: Data for ${folder} not found`);
    ctx.throw(404, `${APP_NAME}: Data for ${folder} not found`);
  }

  const data = [];
  const files = await fsp.readdir(fullPath);  // reads our files into string[]
  for (const file of files) {
    // Only include JSON files
    if (file.indexOf('.json') > 0) {
      data.push(file.replace('.json', '')); // remove extension
    }
  }

  // return our results, "OK"
  ctx.res.setHeader("Content-Type", "application/json");
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.body = data;
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Requested contents of ${folder} returned: ${data.length} item(s)`)
});

// -------------------------------------------------
// Get the JSON contents of a particular file in our
// storage folder.
router.get('/:folder/:file', async ctx => {
  if (!getLoggedInUser(ctx)) {
    return userNotLoggedIn(ctx);
  }

  const folder = ctx.params.folder;
  const file = ctx.params.file;
  const fullPath = path.join(STORAGE_PATH, folder, file + '.json');

  // if the given file doesn't exist, return 404
  if (!fs.existsSync(fullPath))
  {
    console.error(`${APP_NAME}: Data for ${folder}/${file} not found`);
    ctx.throw(404, `${APP_NAME}: Data for ${folder}/${file} not found`);
  }

  const contents = await fsp.readFile(fullPath, 'utf-8');
  const json = JSON.parse(contents);
  ctx.body = json;
  ctx.res.setHeader("Content-Type", "application/json");
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Requested ${folder}/${file}, returned: ${fullPath}`)
}); 

// -------------------------------------------------
// Save JSON data out to a file under the given folder,
// using the folder as its name
router.post('/:folder/:file', KoaBody(), async ctx => {
  if (!getLoggedInUser(ctx)) {
    return userNotLoggedIn(ctx);
  }

  const folder = ctx.params.folder;
  const file = ctx.params.file;
  const folderPath = path.join(STORAGE_PATH, folder);
  const fullPath = path.join(STORAGE_PATH, folder, file + '.json');
  const contents = JSON.stringify(ctx.request.body);

  if (!fs.existsSync(folderPath)) {
    await fsp.mkdir(folderPath);
  }

  await fsp.writeFile(fullPath, contents);
  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Saved contents for ${folder}/${file} to ${fullPath}`);
});

// -------------------------------------------------
router.del('/:folder/:file', async ctx => {
  if (!getLoggedInUser(ctx)) {
    return userNotLoggedIn(ctx);
  }

  const folder = ctx.params.folder;
  const file = ctx.params.file;
  const folderPath = path.join(STORAGE_PATH, folder);
  const fullPath = path.join(STORAGE_PATH, folder, file + '.json');

  if (!fs.existsSync(folderPath)) {
    ctx.res.setHeader("Access-Control-Allow-Origin", "*");
    ctx.response.status = 200;
    console.log(`${APP_NAME}: Delete ${folder}/${file} (did not exist)`);
  }

  await fsp.unlink(fullPath);

  ctx.res.setHeader("Access-Control-Allow-Origin", "*");
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Delete ${folder}/${file} from ${fullPath}`);

});


app
  .use(KoaCors())
  .use(router.allowedMethods())
  .use(router.routes())
  .listen(PORT);

console.log(`${APP_NAME}: Listening on ${PORT}, files will be stored under ${STORAGE_PATH}`);