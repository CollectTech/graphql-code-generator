import { join } from 'path';
import { writeFile } from 'fs/promises';
import { format, resolveConfig } from 'prettier';
import jsonPath from 'jsonpath';
import { transformDocs } from './src/lib/transform';

const MARKDOWN_JSDOC_KEY = 'exampleMarkdown';
const DEFAULT_JSDOC_KEY = 'default';
const OUT_PATH = join(__dirname, 'public/config.schema.json');

const prettierOptions = resolveConfig.sync(__dirname);

async function generate(): Promise<void> {
  const { schema } = transformDocs();
  // Remove non-standard keys
  jsonPath.apply(schema, `$..${MARKDOWN_JSDOC_KEY}`, () => undefined);

  // Remove default to avoid annoying auto-complete
  jsonPath.apply(schema, `$..*`, v => {
    if (v && typeof v === 'object' && v[DEFAULT_JSDOC_KEY] !== undefined) {
      if (!v.description) {
        v.description = '';
      }

      v.description += `\nDefault value: "${v.default}"`;
      delete v.default;
    }
    return v;
  });
  const prettifiedSchema = format(JSON.stringify(schema), { ...prettierOptions, parser: 'json' });
  await writeFile(OUT_PATH, prettifiedSchema);
}

generate()
  .then(() => {
    console.log('✅  Done!');
  })
  .catch(e => {
    console.error(e);
  });
