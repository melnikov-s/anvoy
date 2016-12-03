var context = require.context('./specs/', true, /\.js$/);
context.keys().forEach(context);
module.exports = context;
