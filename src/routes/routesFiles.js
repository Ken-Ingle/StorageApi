const path = require('node:path');     // for getting directory paths
const fs = require("fs");              // Normal Node.js filesystem
const fsp = require("fs").promises;    // filesystem with better async
const KoaBody = require('koa-body');   // Koa body parser middleware
const { authHelper } = require('../authHelper.js');
const { APP_NAME, STORAGE_PATH } = require('../constants.js');

module.exports = function(router) {

  // -------------------------------------------------
  // Given a folder, list out the json files in that folder,
  // returning as an array object
  router.get('/:folder', async ctx => {
    // Get our folder from the parameters, first part of URL
    const folder = ctx.params.folder;
    const fullPath = path.join(STORAGE_PATH, folder);

    if (!authHelper.getLoggedInUser(ctx)) {
      return authHelper.userNotLoggedIn(ctx);
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
    if (!authHelper.getLoggedInUser(ctx)) {
      return authHelper.userNotLoggedIn(ctx);
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
    if (!authHelper.getLoggedInUser(ctx)) {
      return authHelper.userNotLoggedIn(ctx);
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
    if (!authHelper.getLoggedInUser(ctx)) {
      return authHelper.userNotLoggedIn(ctx);
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

}