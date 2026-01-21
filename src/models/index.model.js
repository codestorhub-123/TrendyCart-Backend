const db = {};

db.Admin = require('../models/admin.model.js');
db.User = require('../models/user.model.js');

module.exports = { db };
