import { PromiseType } from '@swind/utils';
import { assert, IsExact } from 'conditional-type-checks';
import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql';

import { createSolarwindObject, ObjectType } from '../../ObjectType';
import { createResolver } from '../../Resolver';
import { GraphType } from '../GraphType';

describe('createResolver', () => {
  afterEach(async () => {
    await ObjectType.reset();
  });

  it('Should create a Resolver', () => {
    const UserType = createSolarwindObject('User', {
      name: { string: {}, description: 'the user name' },
      id: 'ulid',
    });

    const t1 = new GraphType(UserType);

    const resolver = createResolver({
      type: t1,
      name: 'User',
      args: { id: 'ulid' },
      description: 'User resolver',
    }).resolver((_, { id }) => {
      return t1.parse({ id });
    });

    type Return = PromiseType<ReturnType<typeof resolver.resolve>>;
    type Args = Parameters<typeof resolver.resolve>[1];

    assert<IsExact<Return, { id: string; name: string }>>(true);
    assert<IsExact<Args, { id: string }>>(true);

    const object = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          users: resolver,
        }),
      }),
    });

    expect(printSchema(object).split('\n')).toEqual([
      'type Query {',
      '  """User resolver"""',
      '  users(id: Ulid!): User!',
      '}',
      '',
      'type User {',
      '  """the user name"""',
      '  name: String!',
      '  id: Ulid!',
      '}',
      '',
      'scalar Ulid',
    ]);
  });

  it('Should create complex types preserving names', () => {
    const user = createSolarwindObject('user', {
      name: 'string',
      age: 'int?',
    });

    const userAddress = createSolarwindObject('UserAddress', {
      street: 'string',
      number: 'int?',
    }).describe('The user address');

    const t1 = new GraphType(user);

    const resolver = createResolver({
      type: t1,
      name: 'Users',
      args: {
        name: 'string',
        addresses: { type: userAddress, list: true },
        records: { record: { keyType: 'int', type: { enum: ['banana'] } } },
      } as const,
      resolve() {
        return {} as any;
      },
    });

    // type Return = ReturnType<typeof resolver.resolve>;
    type Args = Parameters<typeof resolver.resolve>[1];

    // assert<IsExact<Return, MaybePromise<{ age?: number; name: string }>>>(true);

    assert<
      IsExact<
        Args,
        {
          addresses: {
            number?: number | undefined;
            street: string;
          }[];
          name: string;
          records: { [K: number]: 'banana' };
        }
      >
    >(true);

    const object = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          users: resolver,
        }),
      }),
    });

    expect(printSchema(object).split('\n')).toEqual([
      'type Query {',
      '  users(',
      '    name: String!',
      '',
      '    """The user address"""',
      '    addresses: [UserAddressInput]!',
      '    records: UsersInput_records!',
      '  ): user!',
      '}',
      '',
      'type user {',
      '  name: String!',
      '  age: Int',
      '}',
      '',
      'input UserAddressInput {',
      '  street: String!',
      '  number: Int',
      '}',
      '',
      'scalar UsersInput_records',
    ]);
  });

  it('Should accept literals as type', () => {
    const ap = new GraphType('Airplanes', '[int]?');

    const resolver = createResolver({
      type: ap,
      name: 'Airplanes',
      args: undefined,
      async resolve() {
        return undefined;
      },
    });

    const object = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',

        fields: () => ({
          airplanes: resolver,
        }),
      }),
    });

    expect(printSchema(object).split('\n')).toEqual([
      'type Query {',
      '  airplanes: [Int]',
      '}',
    ]);
  });
});
