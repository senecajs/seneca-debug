import Archy from 'archy'

export default class Intern {
  Seneca: any
  cmdSpec: any
  map: any = {}
  trace!: {
    children: []
    meta: {
      pattern: 'top:true'
    }
  }

  constructor(Seneca: any) {
    this.Seneca = Seneca
    this.cmdSpec = Seneca.argv
  }

  handlePrintTree() {
    if (!this.cmdSpec || !this.cmdSpec.print || !this.cmdSpec.print.tree) {
      return
    }
    // Hack! Complex init means non-deterministic or multiple ready calls,
    // so just delay tree print by some number of seconds to capture full tree.
    const delay_seconds = this.cmdSpec.print.tree.all || this.cmdSpec.print.tree
    if ('number' === typeof delay_seconds) {
      setTimeout(() => {
        this.printTree()
      }, 1000 * delay_seconds)
    } else {
      // Print after first ready
      this.Seneca.ready(() => {
        this.printTree()
      })
    }
  }

  printTree() {
    const tree = {
      label: 'Seneca action patterns for instance: ' + this.Seneca.id,
      nodes: []
    }

    const insert: any = (nodes: any, current: any) => {
      if (nodes.length === 0) return

      for (let i = 0; i < current.nodes.length; i++) {
        if (nodes[0] === current.nodes[i].label) {
          return insert(nodes.slice(1), current.nodes[i])
        }
      }

      var nn = { label: nodes[0], nodes: [] }
      current.nodes.push(nn)
      insert(nodes.slice(1), nn)
    }

    this.Seneca.list().forEach((pat: any) => {
      const nodes = []
      let ignore = false

      Object.keys(pat).forEach(k => {
        const v = pat[k]
        if (
          (!this.cmdSpec.print.tree.all &&
            (k === 'role' &&
              (v === 'seneca' ||
                v === 'basic' ||
                v === 'util' ||
                v === 'entity' ||
                v === 'web' ||
                v === 'transport' ||
                v === 'options' ||
                v === 'mem-store' ||
                v === 'seneca'))) ||
          k === 'init'
        ) {
          ignore = true
        } else {
          nodes.push(k + ':' + v)
        }
        nodes.push(k + ':' + v)
      })

      if (!ignore) {
        let meta = this.Seneca.find(pat)

        const metadesc = []
        while (meta) {
          metadesc.push(
            '# ' +
              (meta.plugin_fullname || '-') +
              ', ' +
              meta.id +
              ', ' +
              meta.func.name
          )
          meta = meta.priormeta
        }

        nodes.push(metadesc.join('\n'))

        insert(nodes, tree)
      }
    })

    console.log(Archy(tree))
  }
}
