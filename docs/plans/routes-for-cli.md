[WIP] routes for cli

routes and current pi construct have to be possible tto use as cli tool
if the route need some body data it  have to be possible to call it by cli
integrate new cli app with routes that will be possible to call.
if the user call `command superman/12` it will call the registted route, /superman/12.
body will be defined by --payload
params wil be defined by ?test=a

if the user call the cli it have to show the help with all commands
it the user call end command alias endpoint it have to siw docs for this endpoints only
