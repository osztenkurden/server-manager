#!/usr/bin/env bun

import { $ } from "bun";

await $`bunx tailwindcss -i ./frontend/index.css -o ./frontend/tindex.css`;

const original = await Bun.file("./frontend/index.css").bytes()


await Bun.write("./frontend/index.css", Bun.file("./frontend/tindex.css"));
await $`bun build --compile index.ts --define="process.env.NODE_ENV='production'" --outfile=server-manager`
await Bun.file("./frontend/tindex.css").delete();

await Bun.write("./frontend/index.css", original);