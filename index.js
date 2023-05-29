const db = require('./db/db');
const webapi = require('./webapi/webapi');

db().then(()=>{
  console.log('database is upto date');
  webapi();
}).catch(e => {
  console.log(e);
})
