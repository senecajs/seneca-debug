const Express = require("express")
const ws = require("ws")

function bootWebServers(seneca, options) {
  return new Promise((resolve, reject) => {
    const { express: expOptions, ws: wsConfig, logToConsole } = options;
    const app = Express();

    app.use(Express.static(`${__dirname}/dist`));

    app.get('/', (req, res) => {
      res.sendFile('index.html');
    });

    app.get('/config', (req, res) => {
      return res.status(200).json({
        port: wsConfig.port,
        expressPort: expOptions.port,
      })
    });

    app.post('/toggle', (req, res) => {
      const active = req.query.active || "false"
      seneca.act(`sys:debug,area:trace,active:${active}`, function cb() {
        return res.status(200).json({ ok: true })
      })
    })

    const expressApp = app.listen(expOptions.port);

    const wsServer = new ws.Server({
      port: wsConfig.port,
    });

    resolve({ expressApp, wsServer });
  })
  
}

module.exports = {
  bootWebServers,
}