const Koa = require('koa');            // Koa: newer, better express.js
const Router = require('koa-router');  // Router for Koa
const fs = require("fs");              // Normal Node.js filesystem
const fsp = require("fs").promises;    // filesystem with better async
const path = require('node:path');     // for getting directory paths

const PORT = 3000;  // default port we'll listen on
const STORAGE_PATH = path.join(__dirname, 'storage');
const APP_NAME = "STORAGE-API";  // just used for logging

// Instantiate our new app and router
const app = new Koa();
const router = new Router();

// -------------------------------------------------
router.get('/', ctx => {
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
  ctx.body = data;
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Requested contents of ${folder} returned: ${data.length} item(s)`)
});

// -------------------------------------------------
// Get the JSON contents of a particular file in our
// storage folder.
router.get('/:folder/:file', async ctx => {
  const folder = ctx.params.folder;
  const file = ctx.params.file;
  const fullPath = path.join(STORAGE_PATH, folder, file + '.json');

  // if the given file doesn't exist, return 404
  if (!fs.existsSync(fullPath))
  {
    console.error(`${APP_NAME}: Data for ${folder}/${file} not found`);
    ctx.throw(404, `${APP_NAME}: Data for ${folder}/${file} not found`);
  }

  const contents = await fsp.readFile(fullPath);
  ctx.res.setHeader("Content-Type", "application/json");
  ctx.response.status = 200;
  ctx.body = contents;
  console.log(`${APP_NAME}: Requested ${folder}/${file}, returned: ${fullPath}`)
}); 

// -------------------------------------------------
// Save JSON data out to a file under the given folder,
// using the folder as its name
router.post('/:folder/:file', async ctx => {
  const folder = ctx.params.folder;
  const file = ctx.params.file;
  const folderPath = path.join(STORAGE_PATH, folder);
  const fullPath = path.join(STORAGE_PATH, folder, file + '.json');
  const contents = JSON.stringify(ctx.request.body);

  if (!fs.existsSync(folderPath)) {
    await fsp.mkdir(folderPath);
  }

  await fsp.writeFile(fullPath, contents);
  ctx.response.status = 200;
  console.log(`${APP_NAME}: Saved contents for ${folder}/${file} to ${fullPath}`);
})

app
  .use(require('koa-body')())
  .use(router.allowedMethods())
  .use(router.routes())
  .listen(PORT);

console.log(`${APP_NAME}: Listening on ${PORT}, files will be stored under ${STORAGE_PATH}`);