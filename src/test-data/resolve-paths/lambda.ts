import { foo } from '#foo'
import { foo2 } from '#foo/2.ts'

export const handler = () => foo() + foo2() // 42 + 17
