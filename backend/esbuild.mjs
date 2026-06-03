import { build } from 'esbuild';

const handlers = [
  'createExpense',
  'getExpense',
  'listExpenses',
  'updateExpense',
  'deleteExpense'
];

await Promise.all(
  handlers.map((handler) =>
    build({
      entryPoints: [`src/handlers/${handler}.ts`],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      outfile: `build/${handler}/index.js`,
      sourcemap: true,
      minify: true
    })
  )
);
