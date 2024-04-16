// Fork from tlaceby:
// https://github.com/tlaceby/guide-to-interpreters-series

// -----------------------------------------------------------
// --------------          AST TYPES        ------------------
// ---     Defines the structure of our languages AST      ---
// -----------------------------------------------------------

export type NodeType =
	// STATEMENTS
	| "Program"
	| "VarDeclaration"
	| "FunctionDeclaration"
	| "LambdaDeclaration"
	// Control Flow
	| "IfExpr"
	// EXPRESSIONS
	| "AssignmentExpr"
	| "MemberExpr"
	| "CallExpr"
	| "ReturnExpr"
	| "DelExpr"
	| "RaiseExpr"
	// Literals
	| "Property"
	| "ObjectLiteral"
	| "NumericLiteral"
	| "Identifier"
	| "BooleanExpr"
	| "ConditionalExpr"
	| "StringLiteral"
	| "ArrayLiteral"
	| "BinaryExpr"
	| "Null";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export interface Stmt {
	kind: NodeType;
}

export interface CallerStmt {
	kind: [NodeType]
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program extends Stmt {
	kind: "Program";
	body: Stmt[];
}

export interface VarDeclaration extends Stmt {
	kind: "VarDeclaration";
	constant: boolean;
	identifier: string;
	value?: Expr;
}

export interface FunctionDeclaration extends Stmt {
	kind: "FunctionDeclaration";
	parameters: string[];
	name: string;
	body: Stmt[];
}

export interface LambdaDeclaration extends Stmt {
	kind: "LambdaDeclaration";
	parameters: string[];
	body: Stmt
}

/**  Expressions will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {}

export interface DelExpr extends Stmt{
	kind: "DelExpr";
	value: string
}

export interface ReturnExpr extends Stmt{
	kind: "ReturnExpr";
	Value: Expr
}

export interface RaiseExpr extends Expr{
	kind: "RaiseExpr",
	value: string
}

export interface AssignmentExpr extends Expr {
	kind: "AssignmentExpr";
	assigne: Expr;
	value: Expr;
}

/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 */
export interface BinaryExpr extends Expr {
	kind: "BinaryExpr";
	left: Expr;
	right: Expr;
	operator: string; // needs to be of type BinaryOperator
}

export interface ConditionalExpr extends Expr {
	kind: "ConditionalExpr"
	left: Expr
	right: Expr
	operator: string
}
/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> > | < | >= | <= 
 */
export interface BooleanExpr extends Expr {
	kind: "BooleanExpr";
	left: Expr;
	right: Expr;
	operator: string; // needs to be of type booleanExpr
}
export interface CallExpr extends Expr {
	kind: "CallExpr";
	args: Expr[];
	caller: Expr;
}

export interface MemberExpr extends Expr {
	kind: "MemberExpr";
	object: Expr;
	property: Expr;
	computed: boolean;
}

export interface IfExpr extends Expr {
	kind: "IfExpr";
	condition: Expr[]
	body: Expr[]
	other: Expr[]//else
}

// LITERAL / PRIMARY EXPRESSION TYPES
/**
 * Represents a user-defined variable or symbol in source.
 */
export interface Identifier extends Expr {
	kind: "Identifier";
	symbol: string;
}

/**
 * Represents a numeric constant inside the soure code.
 */

export interface Literal extends Expr{
	kind: NodeType;
	value: string|number|[Literal]|[]|null;
}

export interface NumericLiteral extends Literal {
	kind: "NumericLiteral";
	value: number;
	lenght: number;
}

export interface StringLiteral extends Literal{
	kind: "StringLiteral";
	value: string;
	lenght: number;
}

export interface ArrayLiteral extends Literal{
	kind: "ArrayLiteral";
	value: [Literal]|[];
	lenght: number;
}

export interface NullLiteral extends Literal{
	kind: "Null"
	value: null
}
export interface Property extends Expr {
	kind: "Property";
	key: string;
	value ?: Expr;
}

export interface ObjectLiteral extends Expr {
	kind: "ObjectLiteral";
	properties: Property[];
}
