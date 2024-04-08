Lambda's will fail if they import from a folder that has the same name as the
handler.

`packLambda` should fail in this case.

See
https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/93#issuecomment-2042201321
