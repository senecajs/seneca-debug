const Express = require("express")
const ws = require("ws")

function bootWebServers(seneca, options) {
  const { express: expOptions, ws: wsConfig, logToConsole } = options;
  const app = Express();

  app.use(Express.static(`${__dirname}/../dist`));

  app.get('/', (req, res) => {
    res.sendFile('index.html');
  });

  app.get('/config', (req, res) => {
    return res.status(200).json({
      port: wsConfig.port,
    })
  });

  const expressApp = app.listen(expOptions.port, () => {
    seneca.shared.expressIsReady = true;
  });

  seneca.shared.expressServer = expressApp;

  const wsServer = new ws.Server({
    port: wsConfig.port,
  });

  seneca.shared.wsServer = wsServer;
}

module.exports = {
  bootWebServers,
}