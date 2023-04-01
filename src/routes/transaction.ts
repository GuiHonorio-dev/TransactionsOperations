import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knexDB } from "../database"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"


export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request, reponse) => {
  })

  app.get('/', {preHandler: [checkSessionIdExists]},async (request, response) => {
    const { sessionId } = request.cookies
    
    const transactions = await knexDB('transactions')
    .where('session_id', sessionId)
    .select('*') 

    return { transactions }
  }) 

  app.get('/:id', {preHandler: [checkSessionIdExists]}, async (request) => {
    const getTrasactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTrasactionParamsSchema.parse(request.params) // Desestruturando para pegar apenas o id, mas poderia ser uma variavel so chamada params

    const { sessionId } = request.cookies

    const transaction = await knexDB('transactions')
      .where({
        session_id: sessionId,
        id,
      })
      .first() // .first() serve para dizer que só vai ter 1 resultado, e nao retornar uma array
      .select('*')

    return { transaction }
  })

  app.get('/summary', {preHandler: [checkSessionIdExists]},async (request) => {
    const { sessionId } = request.cookies

    const summary = await knexDB('transactions')
      .where('session_id', sessionId)
      .sum('amount', {as: 'amount'})
      .first()

    return { summary }

  })

  app.post('/',async (request, response) => {

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })

    const { title, amount, type } = createTransactionBodySchema.parse(request.body)

    let { sessionId } = request.cookies

    if (!sessionId) {
      sessionId = randomUUID()

      response.cookie('sessionId', sessionId, {
        path: '/', // Em quais enderecos esse cookie estara disponivel
        maxAge: 100 * 60 * 60 * 24 * 7 // 7 days
      })
    }
    
    await knexDB('transactions')
      .insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId
      })

      return response.status(201).send()
  })
}