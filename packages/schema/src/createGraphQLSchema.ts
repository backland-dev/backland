import { capitalize, DarchJSON, notNull } from '@darch/utils';
import { tupleEnum } from '@darch/utils/lib/typeUtils';
import type { GraphQLSchemaConfig } from 'graphql';
import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql';
import groupBy from 'lodash/groupBy';

import { Darch } from './Darch';
import { GraphType } from './GraphType/GraphType';
import { generateClientUtils } from './GraphType/generateClientUtils';
import { getInnerGraphTypeId } from './GraphType/getInnerGraphTypeId';
import {
  getSchemaQueryTemplates,
  SchemaQueryTemplatesResult,
} from './GraphType/getQueryTemplates';
import { parseFieldDefinitionConfig } from './ObjectType';
import { AnyResolver } from './Resolver';
import { clearMetaField } from './fields/MetaFieldField';
import { objectMock } from './mockObject';
import type { ObjectToTypescriptOptions } from './objectToTypescript';

export type CreateGraphQLObjectOptions = Partial<GraphQLSchemaConfig>;

export type GroupedResolvers = {
  [K in AnyResolver['kind']]: undefined | AnyResolver[];
};

export type GraphQLSchemaWithUtils = import('graphql').GraphQLSchema & {
  utils: {
    usedConfig: GraphQLSchemaConfig;
    resolvers: AnyResolver[];
    registeredResolvers: AnyResolver[];
    grouped: GroupedResolvers;
    typescript: (options?: ResolversToTypeScriptOptions) => Promise<string>;
    print: () => string;
    queryTemplates: () => SchemaQueryTemplatesResult;
    queryExamples: (options?: { randomText?: () => string }) => string;
    generateClientUtils: () => Promise<string>;
  };
};

export const resolverKinds = tupleEnum('mutation', 'query', 'subscription');
export type ResolverKind = keyof typeof resolverKinds;

export function createGraphQLSchema<T = any>(
  resolvers?: T[],
  config?: CreateGraphQLObjectOptions
): T extends { __isResolver } ? GraphQLSchemaWithUtils : never;

export function createGraphQLSchema<Config>(
  config?: Config
): Config extends CreateGraphQLObjectOptions ? GraphQLSchemaWithUtils : never;

export function createGraphQLSchema(...args: any[]): GraphQLSchemaWithUtils {
  const {
    graphql: { GraphQLSchema },
    GraphType,
  } = Darch;

  const registeredResolvers = [...GraphType.resolvers.values()];

  let resolvers: AnyResolver[] = Array.isArray(args[0])
    ? args[0]
    : registeredResolvers;

  const schemaResolvers = resolvers.filter(
    (el) => el.__isResolver && !el.__isRelation
  );

  const config = Array.isArray(args[0]) ? args[1] : args[0];

  const grouped = groupBy(
    schemaResolvers,
    (item) => item.kind
  ) as GroupedResolvers;

  function createFields(kind: string) {
    const fields = {};
    if (grouped[kind]) {
      grouped[kind].forEach((item) => {
        fields[item.name] = item;
      });
    }
    return fields;
  }

  const usedConfig: GraphQLSchemaConfig = {
    query: grouped.query
      ? new GraphQLObjectType({
          name: 'Query',
          fields: createFields('query'),
        })
      : undefined,

    mutation: grouped.mutation
      ? new GraphQLObjectType({
          name: 'Mutation',
          fields: createFields('mutation'),
        })
      : undefined,

    subscription: grouped.subscription
      ? new GraphQLObjectType({
          name: 'Subscription',
          fields: createFields('subscription'),
        })
      : undefined,

    ...config,
  };

  const schema = new GraphQLSchema(usedConfig);

  let ts: Promise<string>;

  const utils: GraphQLSchemaWithUtils['utils'] = {
    usedConfig,
    resolvers,
    registeredResolvers,
    grouped,
    async typescript(options?: ResolversToTypeScriptOptions) {
      return (ts =
        ts ||
        resolversToTypescript({
          name: 'GraphQLTypes',
          ...options,
          resolvers,
        }));
    },
    print() {
      return printSchema(schema);
    },
    queryTemplates() {
      return getSchemaQueryTemplates(schema);
    },
    queryExamples(options) {
      return queryExamples({ schema, grouped, ...options });
    },
    generateClientUtils() {
      return Promise.reject('not implemented');
    },
  };

  const result = Object.assign(schema, {
    utils,
  });

  utils.generateClientUtils = function _generateClientUtils() {
    return generateClientUtils(result);
  };

  return result;
}

export type ResolversToTypeScriptOptions = {
  name: string;
  options?: ObjectToTypescriptOptions;
  resolvers: AnyResolver[];
};

export async function resolversTypescriptParts(
  params: ResolversToTypeScriptOptions
) {
  const { name = 'Schema' } = params;

  let prefix = '';

  const mainResolvers = params.resolvers.filter((el) => !el.__isRelation);

  const mainResolversConversion = mainResolvers.map((item) => {
    return convertResolver({
      resolver: item,
      allResolvers: params.resolvers,
    });
  });

  const lines = await Promise.all(mainResolversConversion);

  let typesCode = '';
  let interfaceCode = `export interface ${name} {`;

  let queryCode = `export type QueryResolvers = {`;
  let mutationCode = `export type MutationResolvers = {`;
  let subscriptionCode = `export type SubscriptionResolvers = {`;

  lines.forEach((el) => {
    let {
      entryName,
      code,
      payloadName,
      inputName,
      resolver: { description = '', kind },
    } = el;

    typesCode += `${code}\n`;

    if (description) {
      description = `\n/** ${description} **/\n`;
    }

    const resolverCode = `${description} ${entryName}(args: ${inputName}): Promise<${payloadName}>,`;

    switch (kind) {
      case 'mutation': {
        mutationCode += resolverCode;
        break;
      }
      case 'query': {
        queryCode += resolverCode;
        break;
      }
      case 'subscription': {
        subscriptionCode += resolverCode;
        break;
      }
    }

    interfaceCode += `${description} ${entryName}: {input: ${inputName}, payload: ${payloadName}},`;
  });

  let code =
    `${prefix}\n${typesCode}\n${interfaceCode}}\n${queryCode}}\n${mutationCode}}\n${subscriptionCode}}\n`
      .replace(/\n\n/gm, '\n') // remove multi line breaks
      .replace(/^\n/gm, ''); // remove empty lines

  // @ts-ignore circular
  code = Darch.prettier.format(code, {
    parser: 'typescript',
  }) as any;

  return { code, lines };
}

export async function resolversToTypescript(
  params: ResolversToTypeScriptOptions
) {
  const { options = {} } = params;
  const { format = true } = options;

  const { code } = await resolversTypescriptParts(params);

  return format
    ? // @ts-ignore circular
      (Darch.prettier.format(code, {
        parser: 'typescript',
        printWidth: 100,
      }) as any)
    : code;
}

async function convertResolver(options: {
  resolver: AnyResolver;
  allResolvers: AnyResolver[];
}) {
  const { resolver, allResolvers } = options;

  const inputName = resolver.argsType.id;
  const payloadName = resolver.payloadType.id;
  const payloadOriginName = getInnerGraphTypeId(resolver.payloadType);

  const payloadDef = {
    // clearing ref because will be mutated to inject relations in definition
    ...clearMetaField(resolver.typeDef),
  };

  allResolvers
    .filter((el) => el.__isRelation)
    .forEach((rel) => {
      if (rel.__relatedToGraphTypeId === payloadOriginName) {
        const typeRelatedToFinalPayload = GraphType.register.get(
          rel.__graphTypeId
        );
        payloadDef.def[rel.name] = typeRelatedToFinalPayload.definition;
      }
    });

  const [payload, args] = await Promise.all([
    convertType({
      kind: 'output',
      entryName: payloadName,
      type: payloadDef, // TODO generate type for User[] not for plain object
    }),

    convertType({
      kind: 'input',
      entryName: inputName,
      type: resolver.argsType.definition,
    }),
  ]);

  let code = '';

  code += `${args.comments}\nexport type ${inputName} = ${args.code};`;

  code += `${payload.comments}\nexport type ${payloadName} = ${payload.code};`;

  return {
    entryName: resolver.name,
    code,
    payload,
    args,
    inputName,
    payloadName,
    resolver,
  };
}

async function convertType(options: {
  entryName: string;
  type: any;
  kind: 'input' | 'output';
}) {
  const { entryName, type, kind } = options;

  const parsed = parseFieldDefinitionConfig(type);

  const { description } = parsed;

  // @ts-ignore circular
  const result = (await Darch.objectToTypescript(
    entryName,
    {
      __CONVERT__REPLACE__: {
        ...type,
        description: undefined, // prevents breaking the `export type...` etc, above. to improve.
      },
    },
    {
      ...options,
      format: false,
      ignoreDefaultValues: kind !== 'input',
    }
  )) as any;

  let code = result
    .split('\n')
    .slice(1, -2)
    .join('\n')
    .replace('__CONVERT__REPLACE__', '');

  if (code.startsWith('?')) {
    code = `${code} | undefined`;
  }

  code = code.replace(/^\??: /, ``);

  const comments = description ? `\n/** ${description} **/\n` : '';

  return { code, description: description || '', comments };
}

function queryExamples({
  schema,
  grouped,
  randomText,
}: {
  schema: GraphQLSchema;
  grouped: GroupedResolvers;
  randomText?: () => string;
}) {
  let templates = getSchemaQueryTemplates(schema);

  let examples = '';

  Object.entries(grouped).forEach(([_kind, resolvers]) => {
    const kind = _kind as keyof GroupedResolvers;
    if (!resolvers?.length) return;
    const resolversRecord = templates.queryByResolver[kind];

    Object.entries(resolversRecord).forEach(([name, parsed]) => {
      const resolver = notNull(resolvers.find((el) => el.name === name));
      const argsDef = resolver.argsType._object?.definition;
      const argsExamples = argsDef ? objectMock(argsDef, { randomText }) : '';

      examples += `${kind} ${name}${capitalize(kind)} { ${name}`;

      if (parsed.argsParsed.vars.length) {
        examples += '(';
        const args = parsed.argsParsed.vars.map((val) => {
          const ser = DarchJSON.stringify(argsExamples[val.name], {
            quoteKeys(str) {
              if (str.match(/[-.]/)) return JSON.stringify(str);
              return str;
            },
          });
          return `${val.name}: ${ser}`;
        });
        examples += args.join(', ');
        examples += ')';
      }

      if (parsed.query) {
        examples += ` {${parsed.query}} `;
      }

      examples += '}\n';
    });
  });

  return [
    Darch.prettier.format(examples, { parser: 'graphql' }),
    templates.fullQuery,
  ].join('\n');
}
