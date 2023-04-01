import { config } from 'dotenv'
import { z } from 'zod'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config() // Procurar as variaves ambientes no arquivo padrao .env
}

// NODE_ENV -> development, test, production

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  PORT: z.number().default(3333)

})

const _env = envSchema.safeParse(process.env)
// Criando o proprio erro com o safeParse
if (_env.success === false) {
  console.error('Invalid envirionment variables!', _env.error.format())

  throw new Error('Invalid envirionment variables!')
}

export const env = _env.data