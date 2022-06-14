/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'

import { textSpanContainsPosition } from "typescript"

const Util = require('util')

const Lab = require('lab')
const Code = require('code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const { Maintain } = require('@seneca/maintain')

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const Optioner = require('optioner')
const Joi = Optioner.Joi

const DebugPlugin = require('../src/debug');

// undefined bug - Riona is looking through it.
// test('maintain', Maintain);

test('happy', async () => {
  process.argv.push('--seneca.print.tree')

  const si = seneca_instance()

  await si.ready()

  si.message('a:1', async function(msg) {
    return { x: msg.x }
  })
    .message('b:1', async function(msg) {
      const a1 = await this.post('a:1,x:2')
      return { x: a1.x, y: msg.y }
    })
    .message('c:1', async function(msg) {
      throw new Error('C1')
    })

  const out = await si.post('b:1,y:3')
  expect(out).equal({ x: 2, y: 3 })

  try {
    await si.post('c:1')
  } catch (e) {}
})

function seneca_instance(fin?: any, testmode?: any) {
  return Seneca()
    .test(fin, testmode)
    .use('promisify')
    .use(DebugPlugin, {
      express: {
        port: 8899,
        host: 'localhost'
      },
      ws: {
        port: 8898,
      },
      wspath: '/debug',
      store: false,
      test: false,
      prod: false
    })
    .use('seneca-joi')
    .use('entity')
}