import { isInputObjectType, GraphQLFieldConfigArgumentMap, GraphQLOutputType, GraphQLFieldResolver } from 'graphql'

import { EntityFactory, MetadataStorable } from '../interfaces/metadata'
import { MiddlewareClass } from '../interfaces/middleware'
import { MetadataStorage } from '../metadata/MetadataStorage'


const DEFAULT_RETURNS = (node: GraphQLOutputType) => node

export interface SubscriptionParams {
  name?: string
  parent?: EntityFactory
  input?: GraphQLFieldConfigArgumentMap
  middlewares?: MiddlewareClass | MiddlewareClass[]
  returns?: (type: GraphQLOutputType) => GraphQLOutputType | Function
  description?: string
  deprecated?: string
  subscribe: GraphQLFieldResolver<any, any, any>
  storage?: MetadataStorable
}

export function Subscription(params: SubscriptionParams): MethodDecorator {
  const storage = params.storage ?? MetadataStorage.getGlobalStorage()
  const metaSubscriptions = storage.subscriptions
  return (target, property) => {
    let resolves = metaSubscriptions.get(target.constructor)
    if (!resolves) {
      resolves = []
      metaSubscriptions.set(target.constructor, resolves)
    }

    const middleware = params.middlewares ?? []
    const middlewares = Array.isArray(middleware) ? middleware : [middleware]

    const input = params.input
    resolves.push({
      target: target.constructor,
      property,
      parent: params.parent ?? null,
      name: params.name ?? (typeof property === 'string' ? property : property.toString()),
      input: (isInputObjectType(input) ? input.getFields() : input) ?? null,
      middlewares,
      returns: params.returns ?? DEFAULT_RETURNS,
      description: params.description ?? null,
      deprecated: params.deprecated ?? null,
      subscribe: params.subscribe,
    })
  }
}
