#!/usr/bin/env bun

import { $ } from "bun";

const originalPath = "./frontend/index.css";
const temporaryPath = "./frontend/tindex.css";

const original = Bun.file(originalPath);
const temporary = Bun.file(temporaryPath);
const originalContent = await original.bytes();

await $`bunx tailwindcss -i ${originalPath} -o ${temporaryPath}`;
await original.write(temporary);
await temporary.delete();

await $`bun build --compile index.ts --define="process.env.NODE_ENV='production'" --outfile=server-manager`;

await original.write(originalContent);
