const { ApolloServer } = require('apollo-server')
const { makeExecutableSchema } = require('graphql-tools')
const typeDefs = require('../typedefs')
const resolvers = require('../resolvers')

const startExecution = new Date()

const { DEBUG } = process.env

const knownError = [
    'UNAUTHENTICATED'
]

const formatResponse = (response, { operationName, operation = {}, request = {}, context = {} } = {}) => {
    // WARNING: not safe!
    // TODO: remove atleast the request field after prod has somewhat settled
    console.log('Request:', JSON.stringify({
        account_id: context.user && context.user.id,
        account_name: context.user && context.user.name,
        operation_type: operation.operation && operation.operation.toUpperCase(),
        operation_name: operationName,
        request
    }, null, 2))

    if (DEBUG === 'true') {
        const now = new Date()
        let executionTime = now - startExecution
        if (executionTime > 1000) {
            executionTime = `${(executionTime / 1000).toFixed(2)} s`
        } else {
            executionTime = `${executionTime} ms`
        }
        response.data = {
            __debug__: {
                timestamp: now.toISOString(),
                executionTime
            },
            ...response.data
        }
    }
    return response
}

const formatError = error => {
    const { message, locations, path, extensions = {} } = error
    const errorBody = {
        code: extensions.code,
        message,
        data: extensions.errorData,
        path,
        locations,
        stacktrace: extensions.exception && extensions.exception.stacktrace
    }
    if (!knownError.includes(extensions.code)) {
        console.error(errorBody)
    }
    return errorBody
}

const buildContext = ({ event, context }) => ({
    headers: event.headers,
    functionName: context.functionName,
    event,
    context,
})

const server = new ApolloServer({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    debug: DEBUG === 'true',
    formatResponse,
    formatError,
    context: buildContext
})

module.exports.process = server.createHandler({
    cors: {
        origin: '*',
        credentials: true
    }
})
