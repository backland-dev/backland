[Powership](../README.md) / [Modules](../modules.md) / [Transporter - Base to connect any Database to Powership.](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md) / Paginate

# Interface: Paginate<Doc, Indexes\>

[Transporter - Base to connect any Database to Powership.](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md).Paginate

## Type parameters

| Name | Type |
| :------ | :------ |
| `Doc` | extends [`DocumentBase`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#documentbase) |
| `Indexes` | extends [`DocumentIndexesConfig`](Transporter___Base_to_connect_any_Database_to_Powership_.DocumentIndexesConfig.md) |

## Callable

### Paginate

▸ **Paginate**(`options`): `Promise`<{ `edges`: { `cursor`: `string` ; `node`: `Doc`  }[] ; `pageInfo`: { `endCursor`: `undefined` \| `string` ; `hasNextPage`: `boolean` ; `hasPreviousPage`: `boolean` ; `startCursor`: `undefined` \| `string`  }  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Indexes`[`number`] extends `I` ? `I` extends `unknown` ? `I` extends { `PK`: readonly `PK`[] ; `SK?`: readonly `SK`[]  } ? { `after`: `undefined` \| `string` \| [`IndexFilterRecord`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#indexfilterrecord)<`IndexField`<`PK`, `never`\>, `IndexField`<`SK`, `undefined`\>\> extends `R` ? { [K in string \| number \| symbol]: R[K] } : {} ; `condition`: `undefined` \| [`FilterRecord`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#filterrecord)<`Doc`\> ; `consistent`: `undefined` \| `boolean` ; `context`: `undefined` \| [`LoaderContext`](Transporter___Base_to_connect_any_Database_to_Powership_.LoaderContext.md) ; `filter`: `Compute`<`UnionToIntersection`<[`IndexFilterRecord`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#indexfilterrecord)<`IndexField`<`PK`, `never`\>, `IndexField`<`SK`, `undefined`\>\> extends `F` ? `F` extends `unknown` ? { [K in string \| number \| symbol]?: F[K] } & { `id?`: [`PKSKValueType`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#pkskvaluetype)  } : {} : {}\>, ``1``\> ; `first`: `undefined` \| `number` ; `projection`: `undefined` \| `string`[] ; `sort`: `undefined` \| [`QuerySort`](../modules/Transporter___Base_to_connect_any_Database_to_Powership_.md#querysort)  } : `never` : `never` : `never` |

#### Returns

`Promise`<{ `edges`: { `cursor`: `string` ; `node`: `Doc`  }[] ; `pageInfo`: { `endCursor`: `undefined` \| `string` ; `hasNextPage`: `boolean` ; `hasPreviousPage`: `boolean` ; `startCursor`: `undefined` \| `string`  }  }\>

#### Defined in

[packages/transporter/src/IndexMethods.ts:153](https://github.com/antoniopresto/powership/blob/2672a73/packages/transporter/src/IndexMethods.ts#L153)
