const fs = require('fs');
const path = require('path');
const importConstPackage = require('import-cost');
const fileSize = require('filesize');
const { cleanup, JAVASCRIPT, TYPESCRIPT } = importConstPackage;
const runner = importConstPackage.importCost;
const components = require('./fixtures.json');

const DEFAULT_CONFIG = {
  concurrent: false,
  maxCallTime: Infinity
};

const LANGUAGES = {
  ts: TYPESCRIPT,
  js: JAVASCRIPT,
}

const workingFolder = __dirname;

function whenDone(emitter) {
  return new Promise((resolve, reject) => {
    let start;
    const calculated = [];
    emitter.on('start', packages => {
      start = packages;
    });
    emitter.on('calculated', packages => calculated.push(packages));
    emitter.on('done', packages => {
      resolve(packages);
    });
    emitter.on('error', reject);
  });
}


function fixture(fileName) {
    return path.join(workingFolder, 'fixtures', fileName);
}

function importCost(fileName, language = null, config = DEFAULT_CONFIG) {
  if (!language) {
    const extension = fileName.split('.').pop();
    language = LANGUAGES[extension];
  }
  return runner(fileName, fs.readFileSync(fileName, 'utf-8'), language, config);
}

function getPackages(fileName) {
  return whenDone(importCost(fixture(fileName)));
}

async function createFixtures() {
    components.forEach((componentName) => {
        const fixturePath = `./fixtures/${componentName}.js`;
        const fixtureContent = `import { ${componentName}} from 'newskit'`
        fs.writeFileSync(fixturePath, fixtureContent, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

async function test(fileName) {
  const packages = await getPackages(fileName);
  const [ package ] = packages;
  console.log('Component:', fileName, '   Size:', fileSize(package.size), '     gzip:', fileSize(package.gzip));
}


const testComponents = async () => {
  await createFixtures();  
  for (let index = 0; index < components.length; index++) {
    const componentName = components[index];
    await test(componentName + '.js');
    await cleanup();
  }
}

const testModiles = async () => {
  await test('exports.js');
}
(async function () {
  testComponents();
  // testModiles();
}());

