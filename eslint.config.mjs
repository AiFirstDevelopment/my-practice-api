import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "data/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      // TypeScript resolves identifiers itself; leaving no-undef on makes it
      // report every Node global and type-only name as undefined.
      "no-undef": "off",

      // A leading underscore is how the handlers here mark an argument that
      // exists only to hold a position in Express's signature.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Augmenting Express's own types (see todo.types.ts, which adds `todo` to
      // Locals) requires `declare global { namespace Express }`. There is no
      // module-syntax alternative, so allow it in declaration position only.
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    },
  },
);
