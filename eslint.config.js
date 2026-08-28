import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["**/node_modules/**", "**/dist/**", "**/.pi/**", "**/pnpm-lock.yaml"],
	},
	js.configs.recommended,
	...tseslint.configs.strict,
	{
		files: ["**/*.ts"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
);
