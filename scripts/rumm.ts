import spawn from 'child_process';
import path from 'path';

import chalk from 'chalk';
import fs from 'fs-extra';
import * as process from 'process';
import { assertEqual, MaybePromise } from '@backland/utils';

const CWD = process.cwd();
const ENV = ['TEST_TIMEOUT=90000'].join(' ');

const packages = [
  'root',
  'babel-plugins',
  'utils',
  'schema',
  'transporter',
  'mongo',
  'entity',
  'accounts',
  'backland', //
];

const LOGS_FILE = path.resolve(CWD, `logs/build-${Date.now()}-${time().replace(/\D/g, '-')}.log`);
fs.ensureFileSync(LOGS_FILE);
// const logStream = fs.createWriteStream(LOGS_FILE);

function time() {
  const date = new Date();
  return date.toLocaleString();
}

function log(mode: 'info' | 'error', ...rest) {
  const text = rest.join(' ');

  if (mode === 'info') {
    process.stdout.write(`${chalk.bgWhite.black(time())} ${text}\n`);
    // logStream.write(`${time()} ${text}\n`);
  } else {
    process.stderr.write(`${chalk.bgRed.black(time())} ${text}\n`);
    // logStream.write(`====\n**ERROR**====\n${time()} ${text}\n`);
    // logStream.close(() => {
    //   process.exit(2);
    // });
  }
}

function info(_path: string, cmd: string, data: string) {
  const text = `${_path.split('/').slice(-1)} ${cmd} ${data}`;
  log('info', text);
}

function errr(_path: string, cmd: string, data: string) {
  const text = `${_path.split('/').slice(-1)} ${cmd} ${data}`;
  log('error', text);
}

export type Rumm = <
  Mode extends 'sync' | 'async',
  P extends ((json: any) => MaybePromise<string | { command: string; mode?: Mode }>) | string
>(
  run: P
) => P extends string ? string : Mode extends 'sync' ? Promise<string> : Promise<number | null>;

export interface RummInstance {
  list: { json: any; run: Rumm; saveJSON(): void }[];
  map: this['list']['map'];
  root: Rumm;
}

export function rumm() {
  const jsons: { path: string; json: any; dir: string }[] = [];

  packages.forEach((packageName) => {
    const dir = packageName === 'root' ? CWD : path.resolve(CWD, 'packages', packageName);
    const jsonPath = path.resolve(dir, 'package.json');

    jsons.push({
      dir,
      path: jsonPath,
      json: fs.readJSONSync(jsonPath, { encoding: 'utf8' }),
    });
  });

  const list = jsons.map(({ json, path, dir }) => {
    const { name: packageName } = json;
    return {
      json,
      saveJSON() {
        fs.writeFileSync(path, JSON.stringify(json, null, 2));
        return;
      },
      run(callback): any {
        if (typeof callback === 'string') {
          let command = callback;

          if (json.scripts?.[command]) {
            command = `npm run ${command}`;
          }

          const finalCMD = `(cd ${dir} && ${ENV} ${command})`;
          const data = spawn.execSync(finalCMD, { encoding: 'utf8' });
          info(packageName, callback, data);
          info(packageName, callback, 'FINISHED');
          return data;
        }

        return (async () => {
          const config = await callback(json);

          let { command, mode } = ((): { command: string; mode: string } => {
            if (typeof config === 'string') {
              return { command: config, mode: 'async' };
            }

            return { mode: 'async', ...config };
          })();

          if (json.scripts?.[command]) {
            command = `npm run ${command}`;
          }

          const finalCMD = `(cd ${dir} && ${ENV} ${command})`;

          if (mode === 'sync') {
            const data = spawn.execSync(finalCMD, { encoding: 'utf8' });
            info(packageName, command, data);
            info(packageName, command, 'FINISHED');
            return data;
          }

          return new Promise((resolve) => {
            info(packageName, command, 'started');
            const child = spawn.exec(finalCMD);

            if (!child?.stdout || !child?.stderr) {
              info(packageName, command, 'child null');
              throw new Error(typeof child.stderr + typeof child.stdout);
            }

            child.stdout.on('data', (data) => {
              info(packageName, command, data);
            });

            child.stderr.on('data', (data) => {
              if (command.match(/jest|test/)) {
                // jest uses stderr to print logs 🤔 https://github.com/facebook/jest/pull/6583
                info(packageName, command, data);
              } else {
                errr(packageName, command, data);
              }
            });

            child.on('exit', function (code) {
              info(packageName, command, `exited with ${code}`);
              info(packageName, command, 'FINISHED');
              resolve(code);
            });

            child.on('error', function (err) {
              process.stderr.write(require('util').inspect(err, { depth: 10 }));
              process.exit(2);
            });
          });
        })();
      },
    };
  });

  const [root, ...list_] = list;

  assertEqual(root.json.name, 'root');

  return {
    root: root.run,
    list: list_,
    map: Array.prototype.map.bind(list_),
  };
}
