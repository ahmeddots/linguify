import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import _ from 'lodash'
import { getNamespaceJson, getNamespaces, getPath } from './functions'
import { clear } from './object'
import type { DynamicObject } from './types'
import { config, otherLocales } from '@lib/utils'

/**
 * syncs all namespaces
 *
 * creates all for each locale
 */
export const syncNamespaces = () => {
  try {
    // checking or creating locale files
    config.locales.forEach(locale => {
      const path = getPath(locale)
      if (!existsSync(path)) {
        mkdirSync(path)
      } else {
        if (!statSync(path).isDirectory()) {
          throw new Error(
            chalk.yellow(
              `Provided locale '${locale}' is not a valid directory name, please check if a file exists with the same name, please change it before starting`
            )
          )
        }
      }
    })

    // default locale namespaces
    const defaultNSs = getNamespaces()

    // each namespace keys
    const nsKeys: DynamicObject = {}

    // getting default namespaces and keys
    defaultNSs.forEach(ns => {
      const path = getPath(config.defaultLocale, ns)
      const file = readFileSync(path, 'utf-8')
      let json: DynamicObject = {}
      try {
        json = clear(JSON.parse(file))
        writeFileSync(path, JSON.stringify(json))
      } catch {
        writeFileSync(path, '{}')
      }
      nsKeys[ns] = json
    })

    // syncing keys with other files
    otherLocales.forEach(locale => {
      Object.keys(nsKeys).forEach(ns => {
        const path = getPath(locale, ns)
        if (!existsSync(path)) {
          return writeFileSync(path, JSON.stringify({ ...nsKeys[ns] }))
        }
        try {
          const json = clear(getNamespaceJson(locale, ns))
          writeFileSync(path, JSON.stringify(_.defaultsDeep(json, { ...nsKeys[ns] })))
        } catch {
          writeFileSync(path, JSON.stringify({ ...nsKeys[ns] }))
        }
      })
    })
  } catch (error: any) {
    console.error(chalk.red(error.message))
    process.exit(0)
  }
}
