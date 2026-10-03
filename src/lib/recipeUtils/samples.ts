/** Sample recipes seeded into an empty notebook. Each carries `sample: true` so it is easy to spot. */

export interface SampleRecipe {
	id: string;
	text: string;
}

export const SAMPLE_RECIPES: SampleRecipe[] = [
	{
		id: "sample-aglio-e-olio",
		text: `# Aglio e olio
serves: 2
tags: pasta, weeknight
source: https://based.cooking/aglio-e-olio
sample: true

> Salt a large pot of water

fry 2 min
- olive oil: 2 tbsp
- garlic: 2 cloves, sliced
- chilli flakes: 1 pinch
= sauce

boil 9 min
- spaghetti: 200 g
- water: salted
drain -> pasta water
x most of the water
toss 1 min
@ sauce
loosen
@ pasta water: 1/4 cup
serve
- parmesan: 30 g, grated
- parsley: 1 handful, chopped
- olive oil: 1 tbsp
`,
	},
	{
		id: "sample-pancakes",
		text: `# Pancakes
serves: 4
tags: breakfast
sample: true

whisk
- flour: 1 1/2 cups
- baking powder: 3 1/2 tsp
- salt: 1/4 tsp
- sugar: 1 tbsp
= dry

whisk
- milk: 1 1/4 cups
- egg: 1
- butter: 3 tbsp, melted
= wet

combine
@ dry
@ wet
> Lumps are fine, do not overmix
rest 5 min
fry 2-3 min
- butter: 1 tbsp
> Flip when bubbles form and the edges look dry
serve
- maple syrup: to taste
`,
	},
	{
		id: "sample-guacamole",
		text: `# Guacamole
serves: 4
tags: spread, snack
sample: true

mash
- avocados: 3, ripe
- lime juice: 1 tbsp
- salt: 1/2 tsp
fold
- onion: 1/2, finely diced
- coriander: 3 tbsp, chopped
- tomato: 1, diced
- jalapeño: 1, minced
- garlic: 1 clove, minced
rest 10 min
> Press cling film onto the surface to stop browning
serve
- tortilla chips: 1 bag
`,
	},
	{
		id: "sample-tomato-soup",
		text: `# Tomato soup
serves: 4
tags: soup, weeknight
sample: true

sweat 8 min
- olive oil: 2 tbsp
- onion: 1, chopped
- garlic: 2 cloves, sliced
simmer 25 min
- tinned tomatoes: 800 g
- vegetable stock: 500 ml
- sugar: 1 tsp
- salt: 1 tsp
blend
> Blend in batches if using a jug blender
finish
- cream: 100 ml
- basil: 1 handful, torn
serve
- bread: 4 slices, toasted
`,
	},
	{
		id: "sample-chocolate-chip-cookies",
		text: `# Chocolate chip cookies
serves: 24
tags: dessert, baking
sample: true

> Preheat the oven to 180°C (350°F)

cream 3 min
- butter: 225 g, softened
- brown sugar: 200 g
- white sugar: 100 g
beat
- eggs: 2
- vanilla extract: 2 tsp
= wet

whisk
- flour: 300 g
- baking soda: 1 tsp
- salt: 1/2 tsp
= dry

combine
@ wet
@ dry
fold
- chocolate chips: 300 g
scoop
> Golf-ball sized, 5 cm apart on a lined tray
bake 10-12 min
cool 5 min
`,
	},
];
