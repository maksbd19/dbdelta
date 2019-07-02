////////////////////////////////////////////////

const fs = require('fs');
const path = require('path');

const MAX_CONNECTION_ATTEMPT = 3;

////////////////////////////////////////////////

// const log = require("./logger").logger;
import DBManager from './dbManager';

/***********************************************************
 *                                                          *
 *                     HELPER FUNCTIONS                     *
 *                                                          *
 ************************************************************/

export async function calculateDiff(_params) {
  return {
    schema: _diff_in_schema,
    data: _diff_in_data
  };
}

/***
 * CompareData
 *
 * Compare the data between source and target and
 * prepare a list of differences
 */
function compareData(_params) {
  const dataDiffs = [];

  return dataDiffs;
}

function perpareMigrationForSchema(list, fd) {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    // switch (item.type) {
    //     case "column":
    //         break;
    // }

    fd.write(item.newVal);
  }
}

/***
 * GenerateMigrationFile
 *
 * To prepare necessary migration script from the differences
 * prepared in an earlier step save it an a file
 */
async function generateMigrationFile(_diff) {
  const d = new Date();
  const _base = path.join(__dirname, '../migrations');

  if (!fs.existsSync(_base)) {
    fs.mkdirSync(_base);
  }

  function getMigrationFileName(index) {
    return path.join(
      _base,
      `/migration-${d.getDate()}-${d.getMonth() +
        1}-${d.getFullYear()}-${d.getTime()}` +
        (index ? `-${index}` : '') +
        '.sql'
    );
  }

  function file_exists(file) {
    return new Promise((resolve, reject) => {
      fs.access(file, fs.constants.F_OK, err => {
        if (err) {
          return resolve(false);
        }
        return resolve(true);
      });
    });
  }

  let index = 1;
  let fileName = getMigrationFileName();

  while (await file_exists(fileName)) {
    fileName = getMigrationFileName(index);
    index++;
  }

  console.log('Writing migration file to: ' + fileName);

  const fd = fs
    .createWriteStream(fileName, {
      flags: 'a',
      encoding: 'utf-8'
    })
    .on('finish', function() {
      console.log('Write to file is finished.');
    })
    .on('error', function(err) {
      console.log(err.stack);
    });

  if (typeof _diff.schema !== 'undefined' && _diff.schema.length > 0) {
    const list = _diff.schema;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      // switch (item.type) {
      //     case "column":
      //         break;
      // }

      fd.write(item.newVal + '\n');
    }
  }

  fd.end();
}

/***********************************************************
 *                                                          *
 *                           INVOKE                         *
 *                                                          *
 ************************************************************/

// module.exports.calculateDiff = calculateDiff;

// module.exports.delta = async function () {
// 	const parsed = {
// 		hosts: {
// 			source: { ...db.dev, key: "source" },
// 			target: { ...db.local, key: "target" }
// 		}
// 	};

// 	console.log("**********************************");
// 	console.log("       DB DIFF CALCULATOR");
// 	console.log("**********************************");

// 	const diff = await calculateDiff(parsed);

// 	if (!diff) {
// 		console.log("Failed to calculate diff. Operation terminating...");
// 		return;
// 	}

// 	if (diff.data.length === 0 && diff.schema.length === 0) {
// 		console.log("\nIdentical Resources\n");
// 	} else {
// 		console.log(
// 			`Found differences: schema - ${diff.schema.length}, data - ${
// 			diff.data.length
// 			}`
// 		);

// 		// console.log(JSON.stringify(diff, undefined, 2));

// 		await generateMigrationFile(diff);
// 	}

// 	// console.log("....................................\n");
// 	// process.exit(0);
// };
