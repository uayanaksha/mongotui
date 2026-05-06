import {homedir} from "node:os";
import {resolve} from "node:path";

export {}

async function build(OPTS: Bun.BuildConfig){
  let target: Bun.Build.CompileTarget;
  if (process.arch === 'x64') {
    switch (process.platform) {
      case 'win32': target = 'bun-windows-x64-modern';
      case 'darwin': target = 'bun-darwin-x64-modern';
      default: target = 'bun-linux-x64-modern';
    }
  } else {
    switch (process.platform) {
      case 'win32': target = 'bun-windows-arm64';
      case 'darwin': target = 'bun-darwin-arm64-modern';
      default: target = 'bun-linux-arm64-modern';
    }
  }

  const CONFIG: Partial<Bun.BuildConfig> = {
    compile: { target },
    outdir: 'dist/',
  };
  
  await Bun.build({
    ...CONFIG,
    ...OPTS
  });
}

function getOutdir (){
  return resolve(homedir() + '/.local/bin/')
}

const OPTS : Bun.BuildConfig = {
  entrypoints: ["./service/server/index"],
  compile: { outfile: "mongotui" },
  outdir: getOutdir()
}

await build(OPTS)
