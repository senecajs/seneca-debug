const Seneca = require('seneca')
const debug = require('../dist/debug')

setup()

async function setup() {
  const si = Seneca()

  si.test('print')
    .use('promisify')
    .use('seneca-joi')
    .use('entity')
    .use('debug', { test: true })

    .message('a:1', async function (msg) {
      return { x: msg.x }
    })
    .message('b:1', async function (msg) {
      const a1 = await this.post('a:1,x:2')
      return { x: a1.x, y: msg.y }
    })
    .message('c:1', async function (msg) {
      throw new Error('C1')
    })
}
