import { IfExpr } from "./ast.ts";
import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	CallerStmt,
	ReturnExpr,
	DelExpr,
	RaiseExpr,
	Expr,
	Identifier,
	MemberExpr,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Property,
	Stmt,
	VarDeclaration,
	FunctionDeclaration,
	LambdaDeclaration,
	StringLiteral,
	BooleanExpr,
	ConditionalExpr,
	ArrayLiteral,
} from "./ast.ts";

import { Token, tokenize, TokenType } from "./lexer.ts";

const Check =  {
	del: true,
	return: [false/**in function*/, true/**possibility of return*/]
}

const track_caller = {
	kind: ["Program"]
} as CallerStmt


/**
 * Frontend for producing a valid AST from sourcode
 */
export default class Parser {
	private tokens: Token[] = [];

	/*
	 * Determines if the parsing is complete and the END OF FILE Is reached.
	 */
	private not_eof(): boolean {
		return this.tokens[0].type != TokenType.EOF;
	}

	/**
	 * Returns the currently available token
	 */
	private at() {
		return this.tokens[0] as Token;
	}

	private next(){
		return this.tokens[1] as Token;
	}

	/**
	 * Returns the previous token and then advances the tokens array to the next value.
	 */
	private eat() {
		const prev = this.tokens.shift() as Token;
		return prev;
	}

	private combine(type1:Token, type2:Token,): Token{
		switch (type1.value + type2.value){
			case "->":
				return {value: "->", type: TokenType.Arrow} as Token
			case ">=":
				return {value: ">=", type: TokenType.SuperEqual} as Token
			case "<=":
				return {value: "<=", type: TokenType.InferEqual} as Token
			case "=>":
				return {value: "=>", type: TokenType.DoubleArrow} as Token
			case "==":
				return {value: "==", type: TokenType.Equality} as Token
			case "!=":
				return {value: "!=", type: TokenType.Inequality} as Token
			default:
				return {value: "Null", type: TokenType.undefined} as Token
		}

	}

	/**
	 * Returns the previous token and then advances the tokens array to the next value.
	 *  Also checks the type of expected token and throws if the values dnot match.
	 */
	private expect(type: TokenType, err: string): Token{
		const prev = this.tokens.shift() as Token;
		if (!prev || prev.type != type) {
			console.error("ParsingError: "+ err + prev + " - Expecting: "+ type)
			Deno.exit()
		}
		return prev;
	}

	public produceAST(sourceCode: string): Program {
		this.tokens = tokenize(sourceCode);
		const program: Program = {
			kind: "Program",
			body: [],
		};
		// Parse until end of file
		while (this.not_eof()) {
			program.body.push(this.parse_stmt(Check, track_caller));
		}

		return program;
	}

	// Handle complex statement types
	private parse_stmt(check: typeof Check, call: CallerStmt): Stmt {
		// skip to parse_expr
		switch (this.at().type) {
			case TokenType.MutableVariable:
				return this.parse_var_declaration(check, call);
			case TokenType.ConstantVariable:
				return this.parse_var_declaration(check, call);
			case TokenType.Func:
				return this.parse_fn_declaration(check, call);
			case TokenType.IfConditional:
				return this.parse_if_else_expr(check, call);
			case TokenType.WhileLoop:
				return this.parse_while_expr(check, call);
			default:
				return this.parse_expr(check, call);
		}
	}

  parse_while_expr(check: typeof Check, call: CallerStmt): Stmt {
    throw new Error("Method not implemented.");
  }

  parse_if_else_expr(check: typeof Check, call: CallerStmt): Stmt {
	let check_if = false//verif que un if a ete ecrit avant un else/else if
	const condition = Array<Expr|Expr[]>()
	const body = new Array<Expr>()
	while ((this.at().value == "if" && !check_if)|| (this.at().value == "else" && this.next().value == "if" && check_if)){//parse if and if else
    	this.eat()//eat if or else(else if)
		if (this.at().value == "if"){
			this.eat()
		}
		while (this.at().value == "{" && this.next().value != "}" && this.eat()){
			condition.push(this.parse_object_expr(check, call))
		}
		if (this.at().value == "{" && this.next().value == "}"){
			throw "If Expr should contain a condition"
		}
		this.expect(
			TokenType.CloseBrace,
			"If condition should be between braces"
		)
		this.expect(
			TokenType.OpenParen,
			"Code statement should be between parenthese"
		)
		while (this.at().value != ")"){//a check plus tard si les body sont vide
			body.push(this.parse_expr(check, call))
		}
		this.eat()
		check_if = true
		// eat le else si les b
	}
	if (this.at().value == "if" && check_if){
		/**
		if{thing}(
			truc
		)
		if {truc}(
			thing
		)
		 */
		const value = {
			kind: "IfExpr",
			body,
			condition,
			other: []
		}as IfExpr
		return value
	}
	if ((this.at().value == "else" && this.at().value == "if") && !check_if){
		throw "Can't write an else if statement without if statement"
	}
	const other = Array<Expr>()
	if (this.at().value == "else" && check_if && this.eat()){
		this.expect(
			TokenType.OpenParen,
			"Else statement should countains a body and no condition"
		)
		while (this.at().value != ")"){
			other.push(this.parse_expr(check, call))
		}
		this.eat()
	} else if (this.at().value == "else" && !check_if){
		throw "Can't write an else statement without if statement"
	}
	const object = {
		kind: "IfExpr",
		condition,
		body,
		other
	} as IfExpr
	return object
}

	parse_raise_expr(check: typeof Check, call: CallerStmt): Stmt {
		this.eat()// eat raise
		if (this.at().type == TokenType.String){
			const value = this.parse_primary_expr(check, call)
			if (value.kind == "StringLiteral"){ 
				return {kind: "RaiseExpr", value:(value as StringLiteral).value} as RaiseExpr
			} else {
				console.error("Can raise error just with string")
				Deno.exit()
			}
		} else {
			console.error("Can raise error just with string")
				Deno.exit()
		}
	}

  	parse_lambda_declaration(check: typeof Check, call: CallerStmt): Stmt {
    	this.eat();// eat lambda
		this.expect(
			TokenType.Verbar,
				"Expecting a openning vertical bar for the argument(s)"
		)
		const temp_args = this.at().type == TokenType.Verbar ? [] : this.parse_arguments_list(check, call)
		const args = new Array<string> 
		for (const value of temp_args){
			args.push((value as Identifier).symbol)
		}
		
		this.expect(
			TokenType.Verbar,
			"Expecting a closing vertical bar for the argument(s)"
		)

		this.tokens[0] = this.combine(this.eat(), this.at())
		this.expect(
			TokenType.DoubleArrow,
			"Expecting an lambda operator in lambda declaration"
		)
		const LambdaValue = {
			kind: "LambdaDeclaration",
			parameters: args,
			body: {kind: "ReturnExpr", Value:this.parse_expr(check, call)} as ReturnExpr
		} as LambdaDeclaration

		
		return LambdaValue


  	}

	parse_fn_declaration(check: typeof Check, call: CallerStmt): Stmt {
		this.eat(); // eat fn keyword
		
		const fn_name = (this.expect(
			TokenType.Identifier, 
			"Expecting a function name") as Token).value
		
		this.expect(
			TokenType.Verbar,
			"Expecting a openning vertical bar for the argument(s)"
		)
		check.return[0] = true
		check.return[1] = false
		const temp_args = this.at().type == TokenType.Verbar ? [] : this.parse_arguments_list(check, call)
		const args = new Array<string> 
		for (const value of temp_args){
			args.push((value as Identifier).symbol)
		}

		this.expect(
			TokenType.Verbar,
			"Expecting a closing Vertical bar for the argument(s)"
		)

		this.expect(
			TokenType.OpenParen,
			"Expecting a function Body"
		)
		check.return[1] = true
		const body: Stmt[]|Expr = []
		while (this.at().type !== TokenType.CloseParen && this.at().type !== TokenType.EOF){
			if (this.at().type == TokenType.Return){
				this.eat()
				const returnValue = {
					kind: "ReturnExpr",
					Value: this.parse_expr(check, call)
				} as ReturnExpr
				body.push(returnValue)
			} else {
				body.push(this.parse_stmt(check,call))
			}
		}

		this.expect(
			TokenType.CloseParen, 
			"Expecting a closing parenthese for the function declration"
		)
		check.return[0] = false
		check.return[1] = false

		const fn = {
			body,
			name: fn_name,
			parameters: args,
			kind: "FunctionDeclaration",
		} as FunctionDeclaration;
		
		return fn;
	}

	// LET IDENT;
	// ( LET | CONST ) IDENT = EXPR;
	parse_var_declaration(check: typeof Check, call: CallerStmt): Stmt {
		const isConstant = this.eat().type == TokenType.ConstantVariable;
		const identifier = this.expect(
			TokenType.Identifier,
			"Expected identifier name following let | const keywords."
		).value;

		if (this.at().type == TokenType.Semicolon) {
			this.eat(); // expect semicolon
			if (isConstant) {
				throw "Must assigne value to constant expression. No value provided.";
			}

			return {
				kind: "VarDeclaration",
				identifier,
				constant: false,
			} as VarDeclaration;
		}

		this.expect(
			TokenType.Equals,
			"Expected equals token following identifier in var declaration."
		);
		check.del = false
		check.return[1] = false
		const declaration = {
			kind: "VarDeclaration",
			value: this.parse_stmt(check, call),
			identifier,
			constant: isConstant,
		} as VarDeclaration;

		
		return declaration;
	}

	// Handle expressions
	private parse_expr(check: typeof Check, call: CallerStmt): Expr {
		return this.parse_assignment_expr(check, call);
	}

	private parse_return(check: typeof Check, call: CallerStmt): Expr {
		if (
			this.at().value == "return" &&
			check.return[1] === true &&
			check.return[0] === true){
			check.del = false
			check.return[1] = false
			const value = {
				kind: "ReturnExpr",
				Value: this.parse_expr(check, call)
			} as ReturnExpr
			
			return value
		} else if (check.return[0] === false){
			console.error("can't return outside a function")
			Deno.exit()
		} else {
			console.error("Can't return in", )
			Deno.exit()
		}
	}

	parse_delete_expr(_check: typeof Check): Stmt {
		if (this.at().value == "del" &&
			this.next().type == TokenType.Identifier &&
			Check.del === true){
			this.eat()// eat del
			
			return {kind:"DelExpr", value: this.eat().value} as DelExpr
		} else {
			console.error("DeletingError:"+ "Can delete just object not", )
			Deno.exit()
		}
  	}

	private parse_assignment_expr(check: typeof Check, call: CallerStmt): Expr {
		let left = undefined
		if (this.at().type == TokenType.Lambda){
			left = this.parse_lambda_declaration(check, call);
		} else {
			check.del = false
			check.return[1] = false
			left = this.parse_object_expr(check, call)
		}

		if (this.at().type == TokenType.Equals) {
			this.eat(); // advance past equals
			const value = this.parse_assignment_expr(check, call);
			
			return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr;
		}
		
		return left;
	}

	private parse_object_expr(check: typeof Check, call: CallerStmt): Expr {
		if (this.at().type !== TokenType.OpenBrace) {
			return this.parse_array_expr(check, call);
		}

		this.eat(); // advance past open brace.
		const properties = new Array<Property>();

		while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
			const key = this.expect(
				TokenType.Identifier,
				"Object literal key expected"
			).value;

			// Allows shorthand key: pair -> { key, }
			if (this.at().type == TokenType.Comma) {
				this.eat(); // advance past comma
				properties.push({ key, kind: "Property" } as Property);
				continue;
			} // Allows shorthand key: pair -> { key }
			else if (this.at().type == TokenType.CloseBrace) {
				properties.push({ key, kind: "Property" });
				continue;
			}

			// { key: val }
			this.expect(
				TokenType.Colon,
				"Missing colon following identifier in ObjectExpr"
			);
			const value = this.parse_expr(check, call);

			properties.push({ kind: "Property", value, key });
			if (this.at().type != TokenType.CloseBrace) {
				this.expect(
					TokenType.Comma,
					"Expected comma or closing bracket following property"
				);
			}
		}
		
		this.expect(TokenType.CloseBrace, "Object literal missing closing brace.");
		return { kind: "ObjectLiteral", properties } as ObjectLiteral;
	}


	private parse_array_expr(check: typeof Check, call: CallerStmt): Expr{
		if (this.at().type == TokenType.OpenBracket){
			this.eat() // eat opening bracket [
			if (this.at().type != TokenType.CloseBracket){
				// parse les values
				const item = [this.parse_stmt(check, call)]//parse first item
				let number = 1
				while (this.at().type == TokenType.Comma && this.eat()){//parse autre item
					item.push(this.parse_stmt(check, call))
					number ++
				}
				
				this.expect(
					TokenType.CloseBracket,
					"Unexpected token found inside bracketed expression. Expected closing bracket."
				
				); // closing bracket ]
				return {
					kind : "ArrayLiteral",
					value: item,
					lenght: number,
				} as ArrayLiteral;
			} else {
				this.expect(
					TokenType.CloseBracket,
					"Unexpected token found inside bracketed expression. Expected closing bracket."
				); // closing bracket ]
				return {
					kind : "ArrayLiteral",
					value: [],
					lenght: 0,
				} as ArrayLiteral;
			}
		} else {
			
			return this.parse_additive_expr(check, call)
		}
	}


	// Handle Addition & Subtraction Operations
	private parse_additive_expr(check: typeof Check, call: CallerStmt): Expr {
		let left = this.parse_multiplicitave_expr(check, call);

		while (this.at().value == "+" || this.at().value == "-") {
			const operator = this.eat().value;
			const right = this.parse_multiplicitave_expr(check, call);
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr;
		}
		
		return left;
	}

	// Handle Multiplication, Division & Modulo Operations
	private parse_multiplicitave_expr(check: typeof Check, call: CallerStmt): Expr {
		let left = this.parse_conditional_expr(check, call);

		while (
			this.at().value == "/" ||
			this.at().value == "*" ||
			this.at().value == "%" ||
			this.at().value == "^" ||
			this.at().value == "~"
		) {
			const operator = this.eat().value;
			const right = this.parse_conditional_expr(check, call);
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr;
		}
		
		return left;
	}

	private parse_conditional_expr(check: typeof Check, call: CallerStmt): Expr{
		let left = this.parse_boolean_expr(check, call)
		while (
			this.at().value == "and" ||
			this.at().value == "or" ||
			this.at().value == "xor"
		){
			const operator = this.eat().value
			const right = this.parse_boolean_expr(check, call)
			left = {
				kind: "ConditionalExpr",
				left,
				right,
				operator
			}as ConditionalExpr
		}
		return left
	}

	private parse_boolean_expr(check: typeof Check, call: CallerStmt): Expr{
		let left = this.parse_call_member_expr(check, call)
		while (
			this.at().value == "<" ||
			this.at().value == ">" ||
			this.at().value == ">" && this.next().value == "=" ||
			this.at().value == "<" && this.next().value == "=" ||
			this.at().value == "=" && this.next().value == "=" ||
			this.at().value == "!" && this.next().value == "="
		){
			if (
				(this.at().value == ">" && this.next().value == "=") || 
				(this.at().value == "<" && this.next().value == "=") ||
				(this.at().value == "=" && this.next().value == "=") ||
				(this.at().value == "!" && this.next().value == "=")
			){
				this.tokens[0] = this.combine(this.eat(), this.at())
			}
			const operator = this.eat().value;
			const right = this.parse_boolean_expr(check, call);
			left = {
				kind: "BooleanExpr",
				left,
				right,
				operator,
			} as BooleanExpr;
		}
		return left
	}

	// foo.x()()
	private parse_call_member_expr(check: typeof Check, call: CallerStmt): Expr {
		const member = this.parse_member_expr(check, call);
		if (this.at().type == TokenType.OpenParen) {
			return this.parse_call_expr(member, check, call);
		}
		
		return member;
	}

	private parse_call_expr(caller: Expr, check: typeof Check, call: CallerStmt): Expr {
		let call_expr: Expr = {
			kind: "CallExpr",
			caller,
			args: this.parse_args_call(check, call),
		} as CallExpr;

		if (this.at().type == TokenType.OpenParen) {
			call_expr = this.parse_call_expr(call_expr, check, call);
		}
		return call_expr;
	}
	private parse_args_call(check: typeof Check, call: CallerStmt): Expr[] {
		this.expect(TokenType.OpenParen, "Expected openning parenthese on function call ");
		const args =
			this.at().type == TokenType.CloseParen ? [] : this.parse_arguments_list(check, call);


		this.expect(
			TokenType.CloseParen,
			"Missing closing parenthese on function call"
		);
		
		return args;
	}

	private parse_arguments_list(check: typeof Check, call: CallerStmt): Expr[] {
		const args = [this.parse_primary_expr(check, call)];//a changer en parse_assignement_expr pour les arg par defaut
		while (this.at().type == TokenType.Comma && this.eat()) {
			args.push(this.parse_primary_expr(check, call));
		}
		
		return args;
	}

	private parse_member_expr(check: typeof Check, call: CallerStmt): Expr {
		let object = this.parse_primary_expr(check, call);
		while (
			this.at().type == TokenType.Dot ||
			this.at().type == TokenType.OpenBracket
		) {
			const operator = this.eat();
			let property: Expr;
			let computed: boolean;

			// non-computed values aka obj.expr
			if (operator.type == TokenType.Dot) {
				computed = false;
				// get identifier
				property = this.parse_primary_expr(check, call);
				if (property.kind != "Identifier") {
					throw `Cannot use dot operator without right hand side being a identifier`;
				}
			} else {
				// this allows obj[computedValue]
				computed = true;
				property = this.parse_expr(check, call);
				this.expect(
					TokenType.CloseBracket,
					"Missing closing bracket in computed value."
				);
			}

			object = {
				kind: "MemberExpr",
				object,
				property,
				computed,
			} as MemberExpr;
		}
		
		return object;
	}

	// Orders Of Prescidence
	// Assignment
	// Object
	// AdditiveExpr
	// MultiplicitaveExpr
	// Call
	// Member
	// PrimaryExpr

	// Parse Literal Values & Grouping Expressions
	private parse_primary_expr(check: typeof Check, call: CallerStmt): Expr {
		const token = this.at().type;

		// Determine which token we are currently at and return literal value
		switch (token) {
			// User defined values.
			case TokenType.Minus://chiffre négatif
				if ((this.next().type == TokenType.Number) || (this.next().type == TokenType.Float)){
					const value = parseFloat(String(this.at().value + this.next().value))
					this.eat()
					this.eat()
					
					return {
						kind: "NumericLiteral",
						value: value,
					} as NumericLiteral;
				} else {
					console.error("ParsingError:", "Couldn't assign a negative value to type other than Number")
					Deno.exit()
					break
				}
			case TokenType.Plus://chiffre positif
				if ((this.next().type == TokenType.Number) || (this.next().type == TokenType.Float)){
					const value = parseFloat(String(this.at().value + this.next().value))
					this.eat()
					this.eat()
					
					return {
						kind: "NumericLiteral",
						value: value
					} as NumericLiteral;
				} else {
					console.error("ParsingError:", "Couldn't assign a positive value to type other than Number")
					Deno.exit()
					break	
				}
			case TokenType.Identifier:
				
				return { kind: "Identifier", symbol: this.eat().value } as Identifier;

			// Constants and Numeric Constants
			case TokenType.Number:
				return {
					kind: "NumericLiteral",
					value: parseFloat(this.at().value),
					lenght: this.eat().value.length
				} as NumericLiteral;

			case TokenType.Float:
				
				return {
					kind: "NumericLiteral",
					value : parseFloat(this.at().value),
					lenght: this.eat().value.length
				} as NumericLiteral

			// Grouping Expressions
			case TokenType.String:
				
				return {
					kind : "StringLiteral",
					value: this.at().value,
					lenght: this.eat().value.length
				} as StringLiteral
			case TokenType.OpenParen: {
				this.eat(); // eat the opening paren
				const value = this.parse_expr(check, call);
				this.expect(
					TokenType.CloseParen,
					"Unexpected token found inside parenthesised expression. "
				);// closing paren
				
				return value;
				}
			case TokenType.Lambda:
				call.kind.push("LambdaDeclaration")
				return this.parse_lambda_declaration(check, call);
			case TokenType.Delete:{
				call.kind.push("DelExpr")
				return this.parse_delete_expr(check)
			}
			case TokenType.Return:{
				call.kind.push("ReturnExpr")
				return this.parse_return(check, call)
			}
			// Unidentified Tokens and Invalid Code Reached
			default:
				console.log(this.tokens)
				console.error("ParsingError",  ("Unexpected token found" + this.at()))
				Deno.exit()
				break
		}
	}
}
