/* eslint-disable linebreak-style */
/* eslint-disable no-process-env */

const mysql = require('mysql2');
const path = require('path');

require('dotenv').config({
  path: path.join(`${__dirname}/../`, '.env')
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

exports.query = sql =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      }

      connection.query(sql, (error, result) => {
        connection.release();
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
    });
  });
