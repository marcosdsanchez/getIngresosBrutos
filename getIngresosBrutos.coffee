system = require("system")

env = system.env
page = require('webpage').create()

changeUserAgent = ->
  page.settings.userAgent =
    'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.2 Safari/537.36';

injectjQuery = ->
  page.injectJs './jquery.js'
  page.evaluate ->
    jQuery.noConflict()

doLogin = (env)->
  page.evaluate (env)->
    jQuery('#Documento').val(env['DOCUMENTO'])
    jQuery('#txtPin').val(env['PASSWORD'])
    jQuery('form[action="/scripts/homebanking/Registracion.asp"]').submit()
    return true
  , env

enterCuenta = ->
  page.evaluate ->
    window.location.href =
      'https://wsec01.bancogalicia.com.ar/scripts/homebanking/consultivo/ExtractoCuenta.asp?IndiceCuenta=2&TipoCuenta=M'
    return true

choosePeriod = ->
  page.evaluate ->
    jQuery('#selDiaDesde').val('01')
    Reconsultar()
    return true

selectText = ->
  page.evaluate ->
    items = []
    jQuery('tr:contains("ING.BRUTOS")').each (key, value)->
      items[key] = value.getBoundingClientRect()
    return items

renderImage = (item, key)->
  page.clipRect = item
  page.render(key + '.png')

page.onLoadFinished = (status) ->
  if status == 'success'
    changeUserAgent()
    injectjQuery()
    # state is undefined when we first run this script
    if !phantom.state
      doLogin(env)
      phantom.state = 'loginFinished'
    else if phantom.state == 'loginFinished'
      enterCuenta()
      phantom.state = 'enterCuentaFinished'
    else if phantom.state == 'enterCuentaFinished'
      choosePeriod()
      phantom.state = 'choosePeriodFinished'
    else if phantom.state == 'choosePeriodFinished'
      for value, key in selectText()
        renderImage(value, key)
      phantom.exit()
  else
    console.log('Connection failed.')
    phantom.exit()

# console messages send from within page context are ignored by default
# this puts them back where they belong.
page.onConsoleMessage = (msg) ->
  console.log(msg)

page.open(
  'https://wsec01.bancogalicia.com.ar/scripts/homebanking/baselogin.asp'
)
