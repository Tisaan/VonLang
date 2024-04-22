// https://github.com/tlaceby/guide-to-interpreters-series
// -----------------------------------------------------------
// ---------------          LEXER          -------------------
// ---  Responsible for producing tokens from the source   ---
// -----------------------------------------------------------
// Represents tokens that our language understands in parsing.
export enum TokenType {
  // Literal Types
  Number,
  Float,
  String,
  undefined,
  Identifier,

  // Keywords
  Func,// fn
  MatchComparison,// match
  CaseComparison,// case
  Finally,// finally
  Continue,// continue
  Break,// break
  BreakLoop,// loop
  ForLoop,// for
  ElseConditional,// else
  NotComparison,// not
  XorComparison,// xor
  AndComparison,// and
  IsComparison,// is
  OrComparison,// or
  SubClass,// extend
  ImmutableClas,// immut
  MutableClass,//mut
  PublicClass,// public
  Return,// return
  Await,// await
  Async,// async
  Exportable,// export
  CatchExec,// catch
  TryExec,// try
  Delete,// del
  FromFile,// from
  Pass,// pass
  Alias,// as
  LocalVariable,// local
  GlobalVariable,// gloabal
  MutableVariable,// ?
  ConstantVariable,// !
  CodeParameter,// #
  Raise,// raise
  Import,// import
  Lambda,// lambda
  PrivateClass,// private
  Class,// class
  IfConditional,// if
  InLoop,// in
  WhileLoop,// while

  // Grouping * Operators
  Minus,// -
  Plus,// +
  Mull,// *
  Divide,// /
  Modulo,// %
  Arrow,// ->
  DoubleArrow,// =>
  Super,// >
  Infer,// <
  SuperEqual,// >=
  InferEqual,// <=
  BinaryOperator,
  Equals,// =
  Equality,// ==
  Inequality,// !=
  FloorDiv,// ~
  SquareRoot,// `
  Power,// ^

  Comma,// ,
  Dot,// .
  Colon,// :
  Semicolon,// ;
  Verbar,// |
  OpenParen,// (
  CloseParen,// )
  OpenBrace,// {
  CloseBrace,// }
  OpenBracket,// [
  CloseBracket,//]
  EOF
}

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS: Record<string, TokenType> = {

	//Variable Declaration keyword
	"!": TokenType.ConstantVariable,
	"?": TokenType.MutableVariable,
	global: TokenType.GlobalVariable,// to implement
	local: TokenType.LocalVariable,// to implement

	//non context keyword
	"#": TokenType.CodeParameter,// to implement
	as: TokenType.Alias,// to implement
	raise: TokenType.Raise,
	pass: TokenType.Pass,// to implement
	import: TokenType.Import,// to implement
	from: TokenType.FromFile,// to implement
	del: TokenType.Delete,
	try: TokenType.TryExec,// to implement
	catch: TokenType.CatchExec,// to implement

	//Function keyword
	lambda: TokenType.Lambda,
	export: TokenType.Exportable,// to implement
	async: TokenType.Async,// to implement
	fn: TokenType.Func,
	await: TokenType.Await,// to implement
	return: TokenType.Return,

	//Class keyword
	private: TokenType.PrivateClass,// to implement
	public: TokenType.PublicClass,// to implement
	class: TokenType.Class,// to implement
	mut: TokenType.MutableClass,// to implement
	immut: TokenType.ImmutableClas,// to implement
	extend: TokenType.SubClass,// to implement

	//Logical Keyword
	is: TokenType.IsComparison,
	and: TokenType.AndComparison,
	or: TokenType.OrComparison,
	xor: TokenType.XorComparison,
	not: TokenType.NotComparison,// to implementt

	//Control flow keyword
	if: TokenType.IfConditional,
	else: TokenType.ElseConditional,
	for: TokenType.ForLoop,// to implement
	while: TokenType.WhileLoop,
	loop: TokenType.BreakLoop,// to implement
	in: TokenType.InLoop,// to implement
	break: TokenType.Break,// to implement
	continue: TokenType.Continue,// to implement
	finally: TokenType.Finally,// to implement
	match: TokenType.MatchComparison,// to implement
	case: TokenType.CaseComparison,// to implement
};


// Reoresents a single token from the source-code.
export interface Token {
	value: string; // contains the raw value as seen inside the source code.
	type: TokenType; // tagged structure.
}

// Returns a token of a given type and value
function token(value = "", type: TokenType): Token {
	return { value, type };
}

/**
 * Returns whether the character passed in alphabetic -> [a-zA-Z]
 */
function isalpha(src: string) {
	return src.toUpperCase() != src.toLowerCase();
}

/**
 * Returns true if the character is whitespace like -> [\s, \t, \n]
 */
function isskippable(str: string) {
	return str == " " || str == "\n" || str == "\t" || str == "\r";
}

/**
 Return whether the character is a valid integer -> [0-9]
 */
function isint(str: string) {
	const c = str.charCodeAt(0);
	const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
	return c >= bounds[0] && c <= bounds[1];
}

/**
 * Given a string representing source code: Produce tokens and handles
 * possible unidentified characters.
 *
 * - Returns a array of tokens.
 * - Does not modify the incoming string.
 */
export function tokenize(sourceCode: string): Token[] {
	const tokens = new Array<Token>();
	const src = sourceCode.split("");

	// produce tokens until the EOF is reached.
	while (src.length > 0) {
		// Handle numeric literals -> Integers, Float
	
		if (isint(src[0])) {
			let num = "";
			let Float = false
			while (src.length > 0 && isint(src[0]) || src[0] == ".") {
				if (src[0] == "."){
					Float = true
				}
				num += src.shift();
			}

			// append new numeric token.
			if (Float){
				tokens.push(token(num, TokenType.Float));
			}else {
			tokens.push(token(num, TokenType.Number));
			}
		} // Handle Identifier & Keyword Tokens.
		else if (isalpha(src[0])) {
			let ident = "";
			while (src.length > 0 && isalpha(src[0])) {
				ident += src.shift();
			} 


			// CHECK FOR RESERVED KEYWORDS
			const reserved = KEYWORDS[ident];
			// If value is not undefined then the identifier is
			// reconized keyword
			if (typeof reserved == "number") {
				tokens.push(token(ident, reserved));
			} else {
				// Unreconized name must mean user defined symbol.
				tokens.push(token(ident, TokenType.Identifier));
			}
		}// handle String
		else if (src[0] ==  "\"" || src[0] == "\'") {
			src.shift()
			let str = ""
			while (src.length > 0 && isalpha(src[0]) || isskippable(src[0])){
				str += src.shift();
			}
			src.shift()
			tokens.push(token(str, TokenType.String))

		} else if (isskippable(src[0])) {
			// Skip uneeded chars.
			src.shift();
		} // Handle unreconized characters.
		// TODO: Impliment better errors and error recovery.
		else {
		if (src[0] == "(") {
			tokens.push(token(src.shift(), TokenType.OpenParen));
		} else if (src[0] == ")") {
			tokens.push(token(src.shift(), TokenType.CloseParen));
		} else if (src[0] == "{") {
			tokens.push(token(src.shift(), TokenType.OpenBrace));
		} else if (src[0] == "}") {
			tokens.push(token(src.shift(), TokenType.CloseBrace));
		} else if (src[0] == "[") {
			tokens.push(token(src.shift(), TokenType.OpenBracket));
		} else if (src[0] == "]") {
			tokens.push(token(src.shift(), TokenType.CloseBracket));
		} else if (src[0] == "|") {
			tokens.push(token(src.shift(), TokenType.Verbar));
		} else if (src[0] == ">") {
			tokens.push(token(src.shift(), TokenType.Super));
		} else if (src[0] == "<") {
			tokens.push(token(src.shift(), TokenType.Infer));
		}
		 // HANDLE BINARY OPERATORS
		else if (src[0] == "+" ){
			tokens.push(token(src.shift(), TokenType.Plus));
		} else if (src[0] == "-" ) {
			tokens.push(token(src.shift(), TokenType.Minus));
		}else if (src[0] == "*") {
			tokens.push(token(src.shift(), TokenType.Mull));
		}else if (src[0] == "/") {
			if (src[1] == "*"){
				src.shift()
				src.shift()
				//tkt il sont suppr par .shift
				while (src[0] != "*" && src[1] != "/"){
					src.shift()
				}
				src.shift()
				src.shift()
				continue
			}else {
				tokens.push(token(src.shift(), TokenType.Divide));
			}
		}else if (src[0] == "%"){
			tokens.push(token(src.shift(), TokenType.Modulo));
		} // Handle Conditional & Assignment Tokens
		else if (src[0] == "=") {
			tokens.push(token(src.shift(), TokenType.Equals));
		} else if (src[0] == "^"){
			tokens.push(token(src.shift(), TokenType.Power))
		} else if (src[0] == "~"){
			tokens.push(token(src.shift(), TokenType.FloorDiv))
		} else if (src[0] == "`"){
			tokens.push(token(src.shift(), TokenType.SquareRoot))
		} else if (src[0] == ";") {
			tokens.push(token(src.shift(), TokenType.Semicolon));
		} else if (src[0] == ":") {
			tokens.push(token(src.shift(), TokenType.Colon));
		} else if (src[0] == ",") {
			tokens.push(token(src.shift(), TokenType.Comma));
		} else if (src[0] == ".") {
			tokens.push(token(src.shift(), TokenType.Dot));
		// !/ ? handling
		}else if (src[0] == "!"){
			tokens.push(token(src.shift(), TokenType.ConstantVariable))
		} else if (src[0] == "?"){
			tokens.push(token(src.shift(), TokenType.MutableVariable))
		} else if (src[0] == "#"){
			tokens.push(token(src.shift(), TokenType.CodeParameter))
		} else {
			console.error(
				"Unreconized character found in source: ",
				src[0].charCodeAt(0),
				src[0]
			);
			Deno.exit(1);
		 // HANDLE MULTICHARACTER KEYWORDS, TOKENS, IDENTIFIERS ETC...
		}
		
		}
	}

	tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
	return tokens;
}
