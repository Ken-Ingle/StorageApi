const { APP_NAME } = require('../constants.js');

module.exports = function(router) {

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

}