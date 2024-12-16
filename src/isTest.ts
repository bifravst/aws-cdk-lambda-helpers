import type { Construct } from 'constructs'

export const isTest = (construct: Construct): boolean =>
	construct.node.tryGetContext('isTest') === true
