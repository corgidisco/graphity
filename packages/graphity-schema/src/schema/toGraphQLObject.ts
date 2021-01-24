import { GraphQLFieldConfigMap, GraphQLObjectType, isOutputType } from 'graphql'

import { MetadataStorable } from '../interfaces/metadata'
import { MetadataStorage } from '../metadata/MetadataStorage'


export interface ToGraphQLObjectParams {
  storage?: MetadataStorable
}

export function toGraphQLObject(entity: Function, params: ToGraphQLObjectParams = {}): GraphQLObjectType {
  const storage = params.storage ?? MetadataStorage.getGlobalStorage()
  const metaEntity = storage.entities.get(entity)

  let cachedObject = storage.cachedGraphQLObjects.get(entity)
  if (!cachedObject) {
    cachedObject = new GraphQLObjectType({
      name: metaEntity?.name ?? entity.name,
      description: metaEntity?.description,
      fields: () => {
        const metaFields = storage.fields.get(entity) ?? []
        return metaFields.reduce<GraphQLFieldConfigMap<any, any>>((carry, metaField) => {
          const type = metaField.typeFactory(null)
          return Object.assign<GraphQLFieldConfigMap<any, any>, GraphQLFieldConfigMap<any, any>>(carry, {
            [metaField.name]: {
              type: isOutputType(type) ? type : toGraphQLObject(type, params),
              description: metaField.description ?? null,
              deprecationReason: metaField.deprecated ?? null,
            },
          })
        }, {})
      },
    })
    storage.cachedGraphQLObjects.set(entity, cachedObject)
  }
  return cachedObject
}