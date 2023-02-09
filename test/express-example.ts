
// http://localhost:8000/p1?x=1
const Express = require('express')
const Seneca = require('seneca')
const Flame = require('@seneca/flame');
import Debug from '../src/debug';

setupSeneca()


function setupSeneca() {
  Seneca()
    .test()
    // .use('repl')
    // .use('flame', { capture: false })
    .use(Flame, { capture: false })
    .use(Debug, {
      express: {
        port: 8008,
        host: 'localhost'
      },
      ws: {
        port: 8007,
      },
      wspath: '/debug',
      store: false,
      test: false,
      prod: false,
      flame: true,
    })
    .add('a:1', function a1a(msg, reply, meta) {
      setTimeout(()=>{
        this.act('b:1', {x:msg.x}, function(err, out) {
          reply({x:2*out.x})
        })
      }, 400+(400*Math.random()))
    })
    .add('a:1', function a1b(msg, reply, meta) {
      setTimeout(()=>{
        this.prior(msg, function(err, out) {
          reply({x:out.x+0.5})
        })
      }, 400+(400*Math.random()))
    })
    .add('a:1', function a1c(msg, reply, meta) {
      this.prior(msg, function(err, out) {
        reply({x:5+out.x})
      })
    })
    .add('b:1', function b1(msg, reply, meta) {
      setTimeout(()=>{
        reply({x:1+msg.x})
      }, 400+(400*Math.random()))
    })
    .add('c:1', function c1(msg, reply, meta) {
      setTimeout(()=>{
        reply({x:1+msg.x})
      }, 400+(400*Math.random()))
    })
    .ready(function() {
      setupExpress(this)
    })
}


function setupExpress(seneca) {
  Express()
    .get('/p1', function p1(req, res) {
      let x = parseInt(req.query.x || 1)

      seneca.act('a:1', {x}, function p1r(err, out, meta) {
        res.send({ ...out, t:Date.now() })
      })
    })
    .get('/p2', function p2(req, res) {
      let x = parseInt(req.query.x || 1)

      seneca.act('c:1', {x}, function p1r(err, out, meta) {
        res.send({ ...out, t:Date.now() })
      })
    })
    .listen(8006)
}