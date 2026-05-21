export interface CronEntry {
	expression: string;
	description: string;
	example: string;
}

export interface CronCategory {
	name: string;
	entries: CronEntry[];
}

export const CRON_CATEGORIES: CronCategory[] = [
	{
		name: "Common patterns",
		entries: [
			{
				expression: "* * * * *",
				description: "Every minute.",
				example: "Runs continuously, once per minute.",
			},
			{
				expression: "*/5 * * * *",
				description: "Every 5 minutes.",
				example: "Next: 12:00, 12:05, 12:10, ...",
			},
			{
				expression: "*/10 * * * *",
				description: "Every 10 minutes.",
				example: "Next: 12:00, 12:10, 12:20, ...",
			},
			{
				expression: "*/15 * * * *",
				description: "Every 15 minutes.",
				example: "Next: 12:00, 12:15, 12:30, 12:45.",
			},
			{
				expression: "*/30 * * * *",
				description: "Every 30 minutes (i.e. twice an hour).",
				example: "Next: 12:00, 12:30, 13:00, ...",
			},
			{
				expression: "0 * * * *",
				description: "Top of every hour.",
				example: "Next: 12:00, 13:00, 14:00, ...",
			},
			{
				expression: "0 */2 * * *",
				description: "Every 2 hours, on the hour.",
				example: "Next: 12:00, 14:00, 16:00, ...",
			},
			{
				expression: "0 */6 * * *",
				description: "Every 6 hours.",
				example: "Next: 00:00, 06:00, 12:00, 18:00.",
			},
		],
	},
	{
		name: "Daily",
		entries: [
			{
				expression: "0 0 * * *",
				description: "Every day at midnight.",
				example: "Next: tomorrow 00:00, then 00:00 daily.",
			},
			{
				expression: "0 6 * * *",
				description: "Every day at 6:00 AM.",
				example: "Morning batch jobs.",
			},
			{
				expression: "0 12 * * *",
				description: "Every day at noon.",
				example: "Midday refresh.",
			},
			{
				expression: "30 4 * * *",
				description: "Every day at 4:30 AM (good off-peak window).",
				example: "Nightly backups.",
			},
			{
				expression: "0 0,12 * * *",
				description: "Twice a day — midnight and noon.",
				example: "Next: 00:00, 12:00, 00:00, ...",
			},
		],
	},
	{
		name: "Weekly",
		entries: [
			{
				expression: "0 0 * * 0",
				description: "Every Sunday at midnight.",
				example: "Weekly rollover (Sunday = 0 or 7).",
			},
			{
				expression: "0 0 * * 1",
				description: "Every Monday at midnight.",
				example: "Start-of-week report.",
			},
			{
				expression: "0 9 * * 1",
				description: "Every Monday at 9:00 AM.",
				example: "Weekly kickoff job.",
			},
			{
				expression: "0 0 * * 1-5",
				description: "Every weekday at midnight.",
				example: "Mon-Fri overnight task.",
			},
			{
				expression: "0 0 * * 0,6",
				description: "Every weekend day (Sat & Sun) at midnight.",
				example: "Saturday and Sunday only.",
			},
			{
				expression: "0 18 * * 5",
				description: "Every Friday at 6:00 PM.",
				example: "End-of-week summary.",
			},
		],
	},
	{
		name: "Business hours",
		entries: [
			{
				expression: "*/15 9-17 * * 1-5",
				description: "Every 15 minutes during business hours, weekdays.",
				example: "9:00, 9:15, ..., 17:45, Mon-Fri.",
			},
			{
				expression: "0 9-17 * * 1-5",
				description: "Hourly during business hours, weekdays.",
				example: "9, 10, 11, ..., 17 on weekdays.",
			},
			{
				expression: "0 9,13 * * 1-5",
				description: "9 AM and 1 PM on weekdays.",
				example: "Twice a day, work-week only.",
			},
			{
				expression: "*/5 9-17 * * 1-5",
				description: "Every 5 minutes during business hours, weekdays.",
				example: "High-frequency polling 9-5, Mon-Fri.",
			},
		],
	},
	{
		name: "Monthly / yearly",
		entries: [
			{
				expression: "0 0 1 * *",
				description: "First day of every month, midnight.",
				example: "Monthly billing rollover.",
			},
			{
				expression: "0 0 1 1 *",
				description: "January 1st at midnight (yearly).",
				example: "New Year reset.",
			},
			{
				expression: "0 0 15 * *",
				description: "Mid-month — 15th at midnight.",
				example: "Bi-monthly schedule with the 1st.",
			},
			{
				expression: "0 0 L * *",
				description: "Last day of the month at midnight (Quartz / cron extension — not standard).",
				example: "End-of-month tasks (where supported).",
			},
			{
				expression: "0 0 1 */3 *",
				description: "First day of every quarter at midnight.",
				example: "Jan 1, Apr 1, Jul 1, Oct 1.",
			},
			{
				expression: "0 0 1 1,7 *",
				description: "January 1 and July 1 at midnight (semi-annual).",
				example: "Mid-year and year-start tasks.",
			},
		],
	},
	{
		name: "Special strings",
		entries: [
			{
				expression: "@yearly",
				description: "Once a year — equivalent to 0 0 1 1 *. Alias: @annually.",
				example: "Jan 1 at 00:00.",
			},
			{
				expression: "@monthly",
				description: "Once a month — equivalent to 0 0 1 * *.",
				example: "1st of every month at 00:00.",
			},
			{
				expression: "@weekly",
				description: "Once a week — equivalent to 0 0 * * 0.",
				example: "Sunday at 00:00.",
			},
			{
				expression: "@daily",
				description: "Once a day — equivalent to 0 0 * * *. Alias: @midnight.",
				example: "Every day at 00:00.",
			},
			{
				expression: "@hourly",
				description: "Once an hour — equivalent to 0 * * * *.",
				example: "Top of every hour.",
			},
			{
				expression: "@reboot",
				description: "Once at system startup.",
				example: "Run when cron starts (after boot).",
			},
		],
	},
];

export interface CronField {
	name: string;
	range: string;
	notes: string;
}

export const CRON_FIELDS: CronField[] = [
	{ name: "Minute", range: "0–59", notes: "Use */N for every N minutes." },
	{ name: "Hour", range: "0–23", notes: "24-hour clock. */N for every N hours." },
	{ name: "Day of month", range: "1–31", notes: "Beware months with fewer days." },
	{ name: "Month", range: "1–12", notes: "Names also accepted: JAN–DEC." },
	{ name: "Day of week", range: "0–6", notes: "0 and 7 both = Sunday. Names: SUN–SAT." },
];

export const CRON_OPERATORS = [
	{ symbol: "*", meaning: "Any value (every interval of that field)." },
	{ symbol: ",", meaning: "List of values, e.g. 1,3,5." },
	{ symbol: "-", meaning: "Range of values, e.g. 9-17." },
	{ symbol: "/", meaning: "Step values, e.g. */5 = every 5 units." },
	{ symbol: "L", meaning: "Last (Quartz extension — last day of month / last weekday)." },
	{ symbol: "?", meaning: "No specific value (Quartz extension — used in DOM or DOW)." },
];
