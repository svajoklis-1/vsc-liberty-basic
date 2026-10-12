// @ts-check
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig(
    { ignores: ["out/", "node_modules/"] },
    eslint.configs.recommended,
    tseslint.configs.recommended
);
