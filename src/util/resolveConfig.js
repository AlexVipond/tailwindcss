import mergeWith from 'lodash/mergeWith'
import isFunction from 'lodash/isFunction'
import defaults from 'lodash/defaults'
import map from 'lodash/map'
import toPath from 'lodash/toPath'

const configUtils = {
  negative(scale) {
    return Object.keys(scale)
      .filter(key => scale[key] !== '0')
      .reduce(
        (negativeScale, key) => ({
          ...negativeScale,
          [`-${key}`]: `-${scale[key]}`,
        }),
        {}
      )
  },
  fractions(unit) {
    const suffix = unit === '%' ? '' : '-screen',
      fractions = [
        '1/2',
        '1/3',
        '2/3',
        '1/4',
        '2/4',
        '3/4',
        '1/5',
        '2/5',
        '3/5',
        '4/5',
        '1/6',
        '2/6',
        '3/6',
        '4/6',
        '5/6',
        '1/12',
        '2/12',
        '3/12',
        '4/12',
        '5/12',
        '6/12',
        '7/12',
        '8/12',
        '9/12',
        '10/12',
        '11/12',
      ],
      fractionScale = fractions.reduce(
        (scale, fraction) => ({
          ...scale,
          [`${fraction}${suffix}`]: `calc(${fraction} * 100${unit})`,
        }),
        {}
      )

    return {
      ...fractionScale,
      [unit === '%' ? 'full' : 'screen']: `100${unit}`,
    }
  },
}

function value(valueToResolve, ...args) {
  return isFunction(valueToResolve) ? valueToResolve(...args) : valueToResolve
}

function mergeExtensions({ extend, ...theme }) {
  return mergeWith(theme, extend, (themeValue, extensions) => {
    if (!isFunction(themeValue) && !isFunction(extensions)) {
      return {
        ...themeValue,
        ...extensions,
      }
    }

    return (resolveThemePath, utils) => ({
      ...value(themeValue, resolveThemePath, utils),
      ...value(extensions, resolveThemePath, utils),
    })
  })
}

function resolveFunctionKeys(object) {
  const resolveThemePath = (key, defaultValue) => {
    const path = toPath(key)

    let index = 0
    let val = object

    while (val !== undefined && val !== null && index < path.length) {
      val = val[path[index++]]
      val = isFunction(val) ? val(resolveThemePath) : val
    }

    return val === undefined ? defaultValue : val
  }

  return Object.keys(object).reduce((resolved, key) => {
    return {
      ...resolved,
      [key]: isFunction(object[key]) ? object[key](resolveThemePath, configUtils) : object[key],
    }
  }, {})
}

export default function resolveConfig(configs) {
  return defaults(
    {
      theme: resolveFunctionKeys(mergeExtensions(defaults({}, ...map(configs, 'theme')))),
      variants: (firstVariants => {
        return Array.isArray(firstVariants)
          ? firstVariants
          : defaults({}, ...map(configs, 'variants'))
      })(defaults({}, ...map(configs)).variants),
    },
    ...configs
  )
}
