import { createEntity, EntityDefaultFields } from '@backland/entity';
import { createType, Infer } from '@backland/schema';

import { AccountType } from '../types/AccountType';

import { AccessTypeEntity } from './AccessTypeEntity';
import { TokenEntity } from './TokenEntity';

const type = createType('Account', () => ({
  object: AccountType.definition,
}));

export const AccountEntity = createEntity({
  name: 'Account',
  type,
  indexes: [
    // account PK is account#ulid
    // profile PK is profile#ulid(same from account)
    // secondary index has username as PK to performance login with username
    {
      PK: ['.accountId'],
      field: '_id',
      name: 'accountId',
    },
    {
      PK: ['.username'],
      field: '_id2',
      name: 'username',
    },
  ],
}).addIndexRelations({
  tokens: {
    entity: TokenEntity,
  },
  access: {
    entity: AccessTypeEntity,
  },
});

export type AccountEntity = typeof AccountEntity;
export type AccountDocument = Infer<typeof AccountEntity['type']>;
export type AccountInput = Omit<AccountDocument, keyof EntityDefaultFields>;
