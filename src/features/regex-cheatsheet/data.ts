export interface RegexToken {
	token: string;
	description: string;
	example: string;
}

export interface RegexCategory {
	name: string;
	tokens: RegexToken[];
}

export const REGEX_CATEGORIES: RegexCategory[] = [
	{
		name: "Anchors",
		tokens: [
			{ token: "^", description: "Start of string (or line in multiline mode).", example: "^Hello matches \"Hello world\"" },
			{ token: "$", description: "End of string (or line in multiline mode).", example: "world$ matches \"Hello world\"" },
			{ token: "\\b", description: "Word boundary — position between word and non-word characters.", example: "\\bcat\\b matches \"cat\" but not \"category\"" },
			{ token: "\\B", description: "Non-word boundary.", example: "\\Bcat matches \"cat\" inside \"educated\"" },
			{ token: "\\A", description: "Start of input (PCRE / .NET / Python, NOT JS).", example: "\\Astart" },
			{ token: "\\Z", description: "End of input (PCRE / .NET / Python, NOT JS).", example: "end\\Z" },
		],
	},
	{
		name: "Character classes",
		tokens: [
			{ token: ".", description: "Any character except newline (or any char with the s flag).", example: "h.t matches \"hat\", \"hot\", \"hit\"" },
			{ token: "\\d", description: "Any digit (0-9).", example: "\\d{3} matches \"123\"" },
			{ token: "\\D", description: "Any non-digit.", example: "\\D+ matches \"abc\" in \"abc123\"" },
			{ token: "\\w", description: "Word character: [A-Za-z0-9_].", example: "\\w+ matches \"hello_world\"" },
			{ token: "\\W", description: "Non-word character.", example: "\\W matches \" \" or \"-\"" },
			{ token: "\\s", description: "Whitespace (space, tab, newline, etc.).", example: "\\s+ matches \"   \"" },
			{ token: "\\S", description: "Non-whitespace.", example: "\\S+ matches \"hello\" in \" hello \"" },
			{ token: "[abc]", description: "Any one of the listed characters.", example: "[aeiou] matches a vowel" },
			{ token: "[^abc]", description: "Any character NOT in the set.", example: "[^0-9] matches a non-digit" },
			{ token: "[a-z]", description: "Range — any lowercase letter.", example: "[a-zA-Z] matches any letter" },
			{ token: "[0-9]", description: "Range — any digit.", example: "[0-9]+ matches \"42\"" },
			{ token: "\\t", description: "Tab character.", example: "split on \\t" },
			{ token: "\\n", description: "Newline character.", example: "split on \\n" },
			{ token: "\\r", description: "Carriage return.", example: "match \\r\\n line endings" },
			{ token: "\\xHH", description: "Character with hex code HH.", example: "\\x41 matches \"A\"" },
			{ token: "\\uHHHH", description: "Unicode character (4 hex digits).", example: "\\u00e9 matches \"é\"" },
			{ token: "\\p{Letter}", description: "Unicode property class (requires u flag).", example: "/\\p{Letter}+/u matches \"café\"" },
		],
	},
	{
		name: "Quantifiers",
		tokens: [
			{ token: "*", description: "Zero or more of the previous element (greedy).", example: "a* matches \"\", \"a\", \"aaa\"" },
			{ token: "+", description: "One or more (greedy).", example: "a+ matches \"a\" or \"aaa\" but not \"\"" },
			{ token: "?", description: "Zero or one (greedy). Also makes previous quantifier lazy.", example: "colou?r matches \"color\" and \"colour\"" },
			{ token: "{n}", description: "Exactly n times.", example: "\\d{4} matches \"2024\"" },
			{ token: "{n,}", description: "n or more times.", example: "\\d{2,} matches 2+ digits" },
			{ token: "{n,m}", description: "Between n and m times (inclusive).", example: "\\d{2,4} matches 2 to 4 digits" },
			{ token: "*?", description: "Zero or more, lazy (as few as possible).", example: "<.*?> matches \"<a>\" not \"<a>b</a>\"" },
			{ token: "+?", description: "One or more, lazy.", example: "\\(.+?\\) lazy parenthesized match" },
			{ token: "??", description: "Zero or one, lazy.", example: "rarely useful but valid" },
			{ token: "{n,m}?", description: "Lazy range — match as few as possible within range.", example: "\\d{2,4}? prefers 2 digits" },
		],
	},
	{
		name: "Groups & Alternation",
		tokens: [
			{ token: "(abc)", description: "Capturing group — remembers the match.", example: "(\\d+)-(\\d+) captures both numbers" },
			{ token: "(?:abc)", description: "Non-capturing group — for grouping without remembering.", example: "(?:https?):// groups without capture" },
			{ token: "(?<name>abc)", description: "Named capturing group.", example: "(?<year>\\d{4})-\\d{2}-\\d{2}" },
			{ token: "(?=abc)", description: "Positive lookahead — assert what follows.", example: "foo(?=bar) matches \"foo\" only before \"bar\"" },
			{ token: "(?!abc)", description: "Negative lookahead — assert what does NOT follow.", example: "foo(?!bar) matches \"foo\" NOT before \"bar\"" },
			{ token: "(?<=abc)", description: "Positive lookbehind — assert what precedes.", example: "(?<=\\$)\\d+ matches digits after a $" },
			{ token: "(?<!abc)", description: "Negative lookbehind — assert what does NOT precede.", example: "(?<!\\$)\\d+ matches digits NOT after $" },
			{ token: "a|b", description: "Alternation — match a OR b.", example: "cat|dog matches either word" },
			{ token: "(?>abc)", description: "Atomic group (PCRE, .NET — not native JS).", example: "(?>a+)b prevents backtracking" },
		],
	},
	{
		name: "Flags",
		tokens: [
			{ token: "g", description: "Global — find all matches, not just the first.", example: "/abc/g matches every \"abc\"" },
			{ token: "i", description: "Case-insensitive matching.", example: "/hello/i matches \"Hello\", \"HELLO\"" },
			{ token: "m", description: "Multiline — ^ and $ match line breaks.", example: "/^line/m matches start of each line" },
			{ token: "s", description: "Dotall — . matches newlines too.", example: "/foo.bar/s spans newlines" },
			{ token: "u", description: "Unicode mode — enables \\p{} and proper surrogate handling.", example: "/\\u{1F600}/u matches a 4-byte emoji" },
			{ token: "y", description: "Sticky — match at lastIndex only, no skipping.", example: "/abc/y" },
			{ token: "d", description: "Indices — include match start/end positions in result.", example: "/foo/d returns indices" },
		],
	},
	{
		name: "Backreferences",
		tokens: [
			{ token: "\\1, \\2, ...", description: "Reference to the Nth capturing group.", example: "(\\w)\\1 matches double letters like \"oo\"" },
			{ token: "\\k<name>", description: "Reference to a named group.", example: "(?<q>['\\\"]).+?\\k<q> matches paired quotes" },
			{ token: "$1, $2, ...", description: "Backreferences in replacement strings.", example: "replace /(\\w+) (\\w+)/ with $2 $1" },
			{ token: "$&", description: "The entire match (replacement string).", example: "wrap matches with **$&**" },
			{ token: "$`", description: "Text before the match (replacement string).", example: "JS replace context" },
			{ token: "$'", description: "Text after the match (replacement string).", example: "JS replace context" },
		],
	},
	{
		name: "Lookarounds",
		tokens: [
			{ token: "(?=...)", description: "Lookahead — must be followed by the pattern (zero-width).", example: "\\d+(?=px) digits before \"px\"" },
			{ token: "(?!...)", description: "Negative lookahead — must NOT be followed by the pattern.", example: "foo(?!bar) \"foo\" unless followed by \"bar\"" },
			{ token: "(?<=...)", description: "Lookbehind — must be preceded by the pattern.", example: "(?<=USD)\\d+" },
			{ token: "(?<!...)", description: "Negative lookbehind — must NOT be preceded.", example: "(?<!\\d)\\d+ matches numbers not preceded by a digit" },
		],
	},
	{
		name: "Common patterns",
		tokens: [
			{ token: "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", description: "Simple email validator (good enough for most cases).", example: "matches jane@example.com" },
			{ token: "^https?://[^\\s]+$", description: "Match an HTTP or HTTPS URL.", example: "matches https://bittbott.dev" },
			{ token: "^\\d{4}-\\d{2}-\\d{2}$", description: "ISO date YYYY-MM-DD (format check only).", example: "matches 2024-12-31" },
			{ token: "^(?:\\d{1,3}\\.){3}\\d{1,3}$", description: "IPv4 address (format check).", example: "matches 192.168.1.1" },
			{ token: "^#?(?:[a-fA-F0-9]{3}){1,2}$", description: "Hex color (3 or 6 digits, optional #).", example: "matches #ff00aa" },
			{ token: "\\s+", description: "Collapse runs of whitespace.", example: "replace /\\s+/g with single space" },
			{ token: "^\\s+|\\s+$", description: "Trim leading and trailing whitespace.", example: "use with /g flag" },
		],
	},
];
