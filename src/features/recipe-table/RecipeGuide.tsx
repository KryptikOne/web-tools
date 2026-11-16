import styles from "./RecipeTablePage.module.scss";

/** One syntax rule: the prefix a line starts with, what it does, and a worked example. */
const SYNTAX: { prefix: string; name: string; what: string; example: string }[] = [
	{
		prefix: "#",
		name: "Title",
		what: "The first heading line is the recipe name. Everything above the first step is the header.",
		example: "# Aglio e olio",
	},
	{
		prefix: "key:",
		name: "Header field",
		what: "serves is used for scaling, tags is a comma list, source is kept as a link. Any other key is stored as-is.",
		example: "serves: 2\ntags: pasta, weeknight\nsource: https://example.com",
	},
	{
		prefix: "(none)",
		name: "Step",
		what: "Any line with no prefix is a step: an action, then an optional time at the end. Each step uses the step above it unless that one was closed with =.",
		example: "fry 2 min\nbake 10-12 min\nrest",
	},
	{
		prefix: "-",
		name: "Ingredient",
		what: "Belongs to the step above. Write name: amount, prep. Text after the first comma is prep and is never scaled.",
		example: "- garlic: 2 cloves, sliced\n- water: salted",
	},
	{
		prefix: "=",
		name: "Name a result",
		what: "Names what the step above produced and closes the chain. The next step starts a new branch instead of continuing this one.",
		example: "= sauce",
	},
	{
		prefix: "@",
		name: "Use a result or byproduct",
		what: "Pulls a named result or byproduct into the current step. This is how branches merge. The name must be declared above.",
		example: "@ sauce\n@ pasta water: 1/4 cup",
	},
	{
		prefix: "->",
		name: "Byproduct",
		what: "Keeps something a step sets aside, so a later step can take it back with @. Works on its own line or at the end of a step line.",
		example: "drain -> pasta water",
	},
	{
		prefix: "x",
		name: "Discard",
		what: "A note about what the step above throws away. Shown in the step's cell.",
		example: "x most of the water",
	},
	{
		prefix: ">",
		name: "Note",
		what: "Before the first step it is a banner above the table. After a step it is a footnote in that step's cell.",
		example: "> Salt a large pot of water",
	},
];

const RULES: string[] = [
	"One line, one thing. The first character decides what a line is. Blank lines are ignored.",
	"Steps read top to bottom and chain into each other. Only = breaks the chain; use it when you finish a component you will combine later.",
	"Results and byproducts must be declared above the line that uses them. Names are matched without regard to case.",
	"A result (=) has no amount, you use all of it. A byproduct (->) can be used in part, so @ pasta water: 1/4 cup is allowed.",
	"The time on a step must be last on the line: fry 2 min, bake 10-12 min, rest 1 h. Anything else stays part of the action.",
	"Header fields only count before the first step. A serves: line after a step is read as a step.",
	"Mistakes never break the table. Lines that do not make sense are listed under the editor with their line number, and the rest still renders.",
];

const QUANTITIES: string[] = [
	"Amounts are read from the number at the front: 2, 1.5, 1/2, 1 1/2, ½ or a range like 2-3. If there is no leading number the amount is kept as plain text (to taste, a splash) and never changes.",
	"Weight (g, kg, oz, lb) and volume (ml, l, tsp, tbsp, cup, fl oz) are converted between metric and imperial. Counts (2 cloves, 1 egg) only scale.",
	"Scaling multiplies by target serves divided by the recipe's serves. Without a serves: line the recipe counts as 1 serving.",
	"Converted spoon and cup amounts snap to the fractions on real measuring tools (¼, ⅓, ½, ⅔, ¾), and grams round to 5 above 100. Treat converted numbers as kitchen-accurate, not lab-accurate.",
	"The ingredient list merges lines with the same name and adds amounts that share a unit family. 200 g and 1 cup of the same thing stay separate.",
];

/** Explains the table, the syntax and the caveats to someone who has never seen a recipe written this way. */
export default function RecipeGuide() {
	return (
		<section className={styles.guide} aria-labelledby="recipe-guide-title">
			<h2 id="recipe-guide-title" className={styles.guideTitle}>
				How recipe tables work
			</h2>

			<div className={styles.guideGrid}>
				<div className={styles.guideBlock}>
					<h3 className={styles.guideSubtitle}>Reading the table</h3>
					<p className={styles.guideText}>
						This is an action table in the style Michael Chu popularised on Cooking for Engineers. Ingredients run down the left. Each step is a cell that spans every row it uses: its own
						ingredients, the step before it, and any named results it pulls in. Steps merge rightwards until the last one spans the whole recipe. Read a row left to right to follow one
						ingredient; read a column top to bottom to see what happens at each stage.
					</p>
					<p className={styles.guideText}>
						You write the recipe as plain text and the table is drawn from it. Only the text is stored, in this browser, so there is nothing to upload and nothing to lose if you clear a
						cell: fix the text and the table follows.
					</p>
				</div>

				<div className={styles.guideBlock}>
					<h3 className={styles.guideSubtitle}>Rules worth knowing</h3>
					<ul className={styles.guideList}>
						{RULES.map((r) => (
							<li key={r}>{r}</li>
						))}
					</ul>
				</div>
			</div>

			<h3 className={styles.guideSubtitle}>The syntax, line by line</h3>
			<div className={styles.syntaxTable} role="table" aria-label="Recipe syntax">
				<div className={styles.syntaxHead} role="row">
					<span role="columnheader">Starts with</span>
					<span role="columnheader">Meaning</span>
					<span role="columnheader">Example</span>
				</div>
				{SYNTAX.map((s) => (
					<div key={s.name} className={styles.syntaxRow} role="row">
						<span role="cell">
							<code className={styles.syntaxPrefix}>{s.prefix}</code>
						</span>
						<span role="cell">
							<strong>{s.name}.</strong> {s.what}
						</span>
						<span role="cell">
							<pre className={styles.syntaxExample}>{s.example}</pre>
						</span>
					</div>
				))}
			</div>

			<div className={styles.guideGrid}>
				<div className={styles.guideBlock}>
					<h3 className={styles.guideSubtitle}>Branches, in practice</h3>
					<p className={styles.guideText}>Two components prepared separately and joined: close each with =, then pull both into one step with @.</p>
					<pre className={styles.syntaxExample}>{"whisk\n- flour: 1 1/2 cups\n- salt: 1/4 tsp\n= dry\n\nwhisk\n- milk: 1 1/4 cups\n- egg: 1\n= wet\n\ncombine\n@ dry\n@ wet\nfry 2-3 min"}</pre>
					<p className={styles.guideText}>
						In the table, <em>dry</em> and <em>wet</em> become two stacks of rows with their own step cells, and <em>combine</em> spans both.
					</p>
				</div>

				<div className={styles.guideBlock}>
					<h3 className={styles.guideSubtitle}>Amounts, scaling and units</h3>
					<ul className={styles.guideList}>
						{QUANTITIES.map((q) => (
							<li key={q}>{q}</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
