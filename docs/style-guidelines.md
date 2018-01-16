# Style Guidelines

## Generals
  - Strings use single quotes `'`.
  - Prefer Template String over String Concatenation.
  - No Semicolons (except in for loops).
  - Indent with 2 Spaces
  - Always use block bodies `{ /*code*/ }` for loops and if/else statements.
  - Prefer `let` statements over `var` statements.
  - Break up long lines.
  - Prefer arrow function over anonymous functions.

## Functions
  - function parameters on separate lines
  - define parameter types
  - define return type

example:
```javascript
function add(
  a: number,
  b: number
): number {
  return a + b
}
```

## Switches
  - `case` statements have same indent as `switch` statements
  - Always include a `default` case.

example
```javascript
switch (num) {
case 0:
  // code
  break
case 1:
  // code
  break
default:
  // code or throw error
}
```
