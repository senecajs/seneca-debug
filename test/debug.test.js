/* Copyright (c) 2018-2026 Voxgig and other contributors, MIT License */
'use strict'

const Seneca = require('seneca')

const DebugPlugin = require('../src/debug')

// Port 0 lets the operating system choose free ports, so that test runs in
// parallel do not clash. Set SENECA_DEBUG_TEST_EXPRESS_PORT and
// SENECA_DEBUG_TEST_WS_PORT to use fixed ports instead (earlier versions of
// this test used 9099 and 9098).
const EXPRESS_PORT = +(process.env.SENECA_DEBUG_TEST_EXPRESS_PORT || 0)
const WS_PORT = +(process.env.SENECA_DEBUG_TEST_WS_PORT || 0)

// Instances to close after each test, also when it fails.
let open = []
afterEach(async () => {
  const closing = open
  open = []
  for (const si of closing) {
    if (!si.flags.closed) {
      await si.close()
    }
  }
})

test('happy', async () => {
  process.argv.push('--seneca.print.tree')

  const si = seneca_instance()

  await si.ready()

  si.message('a:1', async function (msg) {
    return { x: msg.x }
  })
    .message('b:1', async function (msg) {
      const a1 = await this.post('a:1,x:2')
      return { x: a1.x, y: msg.y }
    })
    .message('c:1', async function (msg) {
      throw new Error('C1')
    })

  const out = await si.post('b:1,y:3')
  expect(out).toEqual({ x: 2, y: 3 })

  await expect(si.post('c:1')).rejects.toThrow('C1')

  // The default debug store recorded the messages.
  const { msgmapdata } = shared(si).debugDataStores[0].debugDataStore.get()
  const patterns = Object.values(msgmapdata).map((m) => m.data.meta.pattern)
  expect(patterns).toContain('b:1')
  expect(patterns).toContain('a:1')

  await si.close()
})

test('web', async () => {
  const si = seneca_instance()
  await si.ready()

  const { expressApp, wsServer } = shared(si)
  const base = 'http://127.0.0.1:' + expressApp.address().port

  const config = await (await fetch(base + '/config')).json()
  expect(config).toEqual({ port: WS_PORT, expressPort: EXPRESS_PORT })

  expect(shared(si).active).toEqual(true)
  let res = await fetch(base + '/toggle?active=false', { method: 'POST' })
  expect(await res.json()).toEqual({ ok: true })
  expect(shared(si).active).toEqual(false)

  res = await fetch(base + '/toggle?active=true', { method: 'POST' })
  expect(await res.json()).toEqual({ ok: true })
  expect(shared(si).active).toEqual(true)

  expect(wsServer.address().port).toBeGreaterThan(0)

  await si.close()

  // seneca.close() closes the web and WebSocket servers.
  expect(expressApp.listening).toEqual(false)
  expect(wsServer.address()).toEqual(null)
})

test('debug-store', async () => {
  const si = seneca_instance()
  await si.ready()

  const created = await si.post('sys:debug,cmd:create_debug_store')
  expect(created.success).toEqual(true)
  expect(typeof created.id).toEqual('string')
  expect(shared(si).debugDataStores.length).toEqual(2)

  si.message('d:1', async function (msg) {
    return { d: 1 }
  })
  await si.post('d:1')

  const destroyed = await si.post('sys:debug,cmd:destroy_debug_store', {
    id: created.id,
  })
  expect(destroyed.success).toEqual(true)
  const patterns = Object.values(destroyed.msgmapdata).map(
    (m) => m.data.meta.pattern
  )
  expect(patterns).toContain('d:1')
  expect(shared(si).debugDataStores.length).toEqual(1)

  expect(
    (await si.post('sys:debug,cmd:destroy_debug_store')).success
  ).toEqual(false)
  expect(
    (await si.post('sys:debug,cmd:destroy_debug_store,id:not-a-store'))
      .success
  ).toEqual(false)

  await si.close()
})

// With option flame and a plugin named flame loaded, the trace toggle is
// passed on as sys:flame,capture:<bool>, the message @seneca/flame handles.
test('flame', async () => {
  const capture = []

  const si = track(Seneca({ legacy: false }))
    .test()
    .use(function flame() {
      this.message('sys:flame', async function (msg) {
        capture.push(msg.capture)
        return { capture: msg.capture }
      })
    })
    .use(DebugPlugin, {
      express: { port: EXPRESS_PORT },
      ws: { port: WS_PORT },
      flame: true,
    })

  await si.ready()

  await si.post('sys:debug,area:trace,active:false')
  expect(shared(si).active).toEqual(false)
  await si.post('sys:debug,area:trace,active:true')
  expect(shared(si).active).toEqual(true)

  expect(capture).toEqual([false, true])

  // Without option flame, sys:flame is not called.
  const si0 = track(Seneca({ legacy: false }))
    .test()
    .use(function flame() {
      this.message('sys:flame', async function (msg) {
        capture.push(msg.capture)
        return { capture: msg.capture }
      })
    })
    .use(DebugPlugin, {
      express: { port: EXPRESS_PORT },
      ws: { port: WS_PORT },
    })
  await si0.ready()
  await si0.post('sys:debug,area:trace,active:false')
  expect(capture).toEqual([false, true])

  await si.close()
  await si0.close()
})

function seneca_instance(fin, testmode) {
  return track(Seneca({ legacy: false }))
    .test(fin, testmode)
    .use(DebugPlugin, {
      express: {
        port: EXPRESS_PORT,
        host: 'localhost',
      },
      ws: {
        port: WS_PORT,
      },
      wspath: '/debug',
      prod: false,
    })
    .use('@seneca/entity')
}

function track(si) {
  open.push(si)
  return si
}

// The plugin's shared resources: web servers and debug stores.
function shared(si) {
  return si.find_plugin('debug').shared
}
