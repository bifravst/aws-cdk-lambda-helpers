import { foo } from '#foo'
import { foo2 } from '#foo/2.js'

export const handler = () => foo() + foo2() // 42 + 17
