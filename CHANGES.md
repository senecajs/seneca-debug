# Changes

## 3.0.0 2026-11-22

First entry of this change log. Earlier versions are on npm and in the git
history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (2.1.0 declared
  none). Seneca 3 users stay on `@seneca/debug@2`.
* Node.js 24 or later (`engines.node` `>=24`).
* The option defaults are a plain object (B1). Seneca 4 validates options
  with shape and rejects defaults built with Gubu, so 2.1.0 stops at
  startup there with `plugin_gubu_shape`. The gubu import is removed; gubu
  was never a declared dependency. The option names and default values are
  unchanged.
* Breaking: options that are not in the defaults are refused
  (`invalid_plugin_option`); 2.1.0 accepted any top level option. `flame`
  (show flame graphs when `@seneca/flame` is loaded), which the plugin
  reads, is now declared, default `false`. The 1.x options `store` and
  `test`, which 2.x does not read, are refused.
* `seneca.close()` closes the web and WebSocket servers, and stops polling
  `@seneca/flame`. The close action is registered with `this.destroy`, so
  the close actions of other plugins run as well (D4). 2.1.0 used
  `role:seneca,cmd:close` and did not call them.
* The runtime dependencies `@seneca/repl` (unused) and `typescript` (needed
  only to build) are removed.
* The web server module is loaded by its file name, so Node.js no longer
  warns about the `main` field of the front end's `web/package.json`
  (DEP0128).
* `repository` points at `senecajs/seneca-debug` (was `voxgig`).
* The tests use jest's `expect` and no longer load `seneca-promisify`,
  `seneca-joi`, `lab`, `code` or `seneca-plugin-validator` (D4). They
  listen on ports that the operating system picks (port 0), so parallel
  runs do not clash, and cover the web endpoints `/config` and `/toggle`,
  the debug stores, closing, and the `sys:flame,capture:<bool>` message
  sent to `@seneca/flame`.
