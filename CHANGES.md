# Changes

## 3.0.0 2026-10-22

* Seneca 4 and Seneca 3.38 support. Seneca 4.0.0 validates with
  [shape](https://github.com/rjrodger/shape), the renamed successor of
  Gubu, and rejects option defaults built with Gubu
  (`plugin_gubu_shape`), so 2.1.0 stops the process at startup there.
  Seneca 3.38 cannot read a builder node at the root of the defaults,
  so 2.1.0 does not load there either ("Cannot read properties of
  undefined (reading 'gubu')"). The defaults are now a plain object,
  with the same options and default values.
* Breaking: on Seneca 4, options that are not in the defaults are
  refused (`invalid_plugin_option`); 2.1.0 accepted any top level
  option. `flame` (show flame graphs when @seneca/flame is loaded),
  which the plugin reads, is now declared, default `false`. The 1.x
  options `store` and `test`, which 2.x does not read, are refused on
  Seneca 4. Seneca 3 still accepts unknown options.
* `seneca.close()` closes the web and WebSocket servers on Seneca 4.
  The close hook is registered on `sys:seneca,cmd:close` on Seneca 4
  (`role:seneca,cmd:close` on Seneca 3), and calls `prior`, so the
  close actions of other plugins run as well.
* The gubu import is removed. gubu was never a declared dependency; it
  was available only through Seneca's own dependency on it.
* `seneca` is a peer dependency, `>=3.38||>=4.0.0-rc5` (there was
  none).
* The tests run against Seneca 4.0.0, 4.0.0-rc5 (the development
  dependency, `^4.0.0-rc5`) and 3.38 (with seneca-promisify), with
  @seneca/entity. The repository's `.npmrc` sets `legacy-peer-deps`
  until Seneca 4.0.0 is published.
